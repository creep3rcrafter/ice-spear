/**
 * @copyright 2018 - Max Bebök
 * @author Max Bebök
 * @license GNU-GPLv3 - see the "LICENSE" file in the root directory
 */

const electron = require("electron");
const fs = require("fs-extra");
const path = require("path");
const url = require("url");
const os = require("os");

const Split = require("split.js");

const Notify = requireGlobal("lib/notify/notify.js");
const Filter = requireGlobal("lib/filter.js");

const Binary_File_Loader = require("binary-file").Loader;
const SARC = require("sarc-lib");
const Shrine_Editor = require("./lib/shrine_editor.js");
const ActorParams = require("../../lib/mubin_editor/actor/params");
const Actor_Templates = require("../../lib/mubin_editor/actor/template");
const String_Table = requireGlobal("lib/string_table/string_table.js");
const JSON_IPC = require("./../../lib/json_ipc/json_ipc");

const { dialog } = electron.remote;
const BrowserWindow = electron.remote.BrowserWindow;

const App_Base = requireGlobal("apps/base.js");
const { clipboard } = require("electron");
const CONFIG_DIR = path.join(os.homedir(), ".ice-spear");
const userTemplateDir = path.join(CONFIG_DIR, "/templates");

module.exports = class App extends App_Base {
    constructor(window, args) {
        super(window, args);

        this.dataActorDyn = {};

        this.shrineDir = null;
        this.shrineFiles = null;

        this.footerNode = footer.querySelector(".data-footer");

        this.fileLoader = new Binary_File_Loader();
        this.shrineName = "";

        this.stringTable = new String_Table(this.project.getCachePath());

        Split(["#main-sidebar-1", "#main-sidebar-2", "#main-sidebar-3"], {
            sizes: [15, 65, 20],
            minSize: 0,
            snapOffset: 60,
            gutterSize: 12
        });
    }

    initTools() {
        this.node.querySelector(".data-tool-save").onclick = () =>
            this.save(false);
        this.node.querySelector(".data-tool-saveBuild").onclick = () =>
            this.save(true);
        this.node.querySelector(".data-tool-openBuildDir").onclick = () => {
            electron.shell.showItemInFolder(
                this.shrineEditor.getPackFilePath()
            );
        };
        this.node.querySelector(".data-tool-buildTemplate").onclick = () =>
          this.buildTemplate();
        /*
        this.node.querySelector(".data-tool-openLogicEditor").onclick = async () => 
        {
            if(!this.jsonIpc)
            {
                this.jsonIpc = new JSON_IPC("shrine-editor-" + this.shrineName);
                await this.jsonIpc.createServer((name, type, data) => 
                {
                    if(type == "logic-editor-ready")
                    {
                        this.jsonIpc.send(name, "actor-data", {
                            actorsDyn   : this.shrineEditor.actorHandler.dataActorDyn,
                            actorsStatic: this.shrineEditor.actorHandler.dataActorStatic,
                        });
                    }
                });
            }

            this.windowHandler.open("logic_editor", {mapName: this.shrineName});
        };
*/
        this.node.querySelector(".data-tool-addActorStatic").onclick =
            async () => {
                this.shrineEditor.actorHandler.addFromData(
                    ActorParams.createTemplate(
                        "FldObj_HugeMazeTorchStand_A_01"
                    ),
                    "Static"
                );
            };

        this.node.querySelector(".data-tool-addActorDyn").onclick =
            async () => {
                this.shrineEditor.actorHandler.addFromData(
                    ActorParams.createTemplate(
                        "FldObj_HugeMazeTorchStand_A_01"
                    ),
                    "Dynamic"
                );
            };

        Actor_Templates.getHtmlSelect().then(
            html =>
                (this.node.querySelector(".data-tool-actorTemplate").innerHTML =
                    html)
        );

        this.node.querySelector(".data-tool-addActorTemplate").onclick =
            async () => {
                const templateName = this.node.querySelector(
                    ".data-tool-actorTemplate"
                ).value;
                this.shrineEditor.actorHandler.addFromTemplate(templateName);
            };
    }
    /**
   * Template Builder
   * Im aware this code is crap but ill fix it later.
   */
     async buildTemplate() {
        await this.loader.setStatus("Building Template");
        await this.loader.show();
    
        if (this.shrineEditor.actorEditor.selectedActors == 0) {
          await this.loader.hide();
          Notify.error("Nothing Selected", "Template Builder Failed");
        } else {
          var JSONObject;
          var JSONArray = [];
          var hashIds = [];
          var initX;
          var initY;
          var initZ;
    
          for (
            var i = 0;
            i < this.shrineEditor.actorEditor.selectedActors.length;
            i++
          ) {
            JSONObject = JSON.parse(
              this.shrineEditor.actorEditor.selectedActors[i].getParamJSON()
            );
            if (i == 0) {
              initX = JSONObject["Translate"][0]["value"];
              JSONObject["Translate"][0]["value"] = 0;
              initY = JSONObject["Translate"][1]["value"];
              JSONObject["Translate"][1]["value"] = 0;
              initZ = JSONObject["Translate"][2]["value"];
              JSONObject["Translate"][2]["value"] = 0;
            } else {
              JSONObject["Translate"][0]["value"] =
                JSONObject["Translate"][0]["value"] - initX;
              JSONObject["Translate"][1]["value"] =
                JSONObject["Translate"][1]["value"] - initY;
              JSONObject["Translate"][2]["value"] =
                JSONObject["Translate"][2]["value"] - initZ;
            }
            var id = "{ID" + i + "}";
            hashIds[i] = {
              HashId: JSONObject["HashId"]["value"],
              id: id,
            };
            JSONObject["HashId"]["value"] = id;
            JSONArray.push(JSONObject);
          }
    
          for (var j = 0; j < JSONArray.length; j++) {
            if ("LinksToObj" in JSONArray[j]) {
              for (var k = 0; k < JSONArray[j]["LinksToObj"].length; k++) {
                if (
                  !hashIds.some((item) => {
                    if (
                      item["HashId"] ==
                      JSONArray[j]["LinksToObj"][k]["DestUnitHashId"]["value"]
                    ) {
                      JSONArray[j]["LinksToObj"][k]["DestUnitHashId"]["value"] =
                        item["id"];
                      return true;
                    } else {
                      return false;
                      a;
                    }
                  })
                ) {
                  JSONArray[j]["LinksToObj"][k]["DestUnitHashId"]["value"] =
                    "Unknown";
                }
              }
            }
          }
    
          var name = document.getElementById("templateInput").value;
    
          var actor = {
            name: name,
            actors: JSONArray,
          };
    
          if (name == "") {
            await this.loader.hide();
            Notify.error("Invalid Name", "Template Builder Failed");
          } else {
            var fileName = this.snakeCase(name) + ".json";
            //clipboard.writeText(JSON.stringify(actor, null, 2));
            fs.writeFileSync(
              path.join(userTemplateDir, fileName),
              JSON.stringify(actor, null, 2),
              async function (err) {
                if (await err) {
                  Notify.error("File Error", "Template Builder Failed");
                }
              }
            );
            await this.loader.hide();
            Notify.success(
              path.join(userTemplateDir, fileName).toString(),
              "Template Built"
            );
            Actor_Templates.getHtmlSelect().then(
              (html) =>
                (this.node.querySelector(".data-tool-actorTemplate").innerHTML =
                  html)
            );
          }
        }
      }

  /**
   * Not mine IDK where I got this.
   */
  snakeCase = (string) => {
    const toSnakeCase = (str = "") => {
      const strArr = str.split(" ");
      const snakeArr = strArr.reduce((acc, val) => {
        return acc.concat(val.toLowerCase());
      }, []);
      return snakeArr.join("_");
    };
    const newText = toSnakeCase(string);
    return newText;
  };

    /**
     * saves the shrine
     * @param {bool} repack if true, it rebuilds the .pack file
     */
    async save(rebuild = true) {
        await this.shrineEditor.save(rebuild);

        Notify.success(`Shrine '${this.shrineName}' saved`);
    }

    async openShrine(shrineDirOrFile = null) {
        if (shrineDirOrFile == "" || shrineDirOrFile == null) {
            let paths = dialog.showOpenDialog({
                properties: ["openDirectory"]
            });
            if (paths != null) shrineDirOrFile = path[0];
            else return false;
        }

        await this.loader.show();
        await this.loader.setStatus("Loading Shrine");
        try {
            this.stringTable.loader = this.loader;
            //await this.stringTable.load(); // not needed now, yay!

            if (typeof global.gc == "function")
                // free some memory after maybe loading the stringtable
                global.gc();

            let fileName = shrineDirOrFile.split(/[\\/]+/).pop();
            this.shrineDir = path.join(
                this.project.getShrinePath("unpacked"),
                fileName + ".unpacked"
            );

            this.shrineName =
                fileName.match(/Dungeon[0-9]+/) ||
                fileName.match(/Remains[A-Za-z]+/);

            if (this.shrineName != null) {
                this.shrineName = this.shrineName[0];
            }

            const alreadyExtracted = await fs.pathExists(this.shrineDir);

            // extract if it's not a directory
            if (!alreadyExtracted && fs.lstatSync(shrineDirOrFile).isFile()) {
                let sarc = new SARC(this.stringTable);
                this.shrineFiles = sarc.parse(shrineDirOrFile);
                await sarc.extractFiles(this.shrineDir, true);
            }

            await this.shrineEditor.load(this.shrineDir, this.shrineName);

            this.render();
        } catch (e) {
            await this.loader.hide();
            console.error(e);
            throw e;
        }

        await this.loader.hide();
    }

    render() {
        this.footerNode.innerHTML = "Loaded Shrine: " + this.shrineDir;

        this.node.querySelector(".data-shrine-name").innerHTML =
            this.shrineName;

        this.node.querySelector(".data-actors-staticCount").innerHTML =
            this.shrineEditor.actorHandler.dataActorStatic.Objs.length;
        this.node.querySelector(".data-actors-dynamicCount").innerHTML =
            this.shrineEditor.actorHandler.dataActorDyn.Objs.length;

        this.shrineEditor.start();
    }

    async run() {
        await super.run();

        this.shrineEditor = new Shrine_Editor(
            this.node.querySelector(".shrine-canvas"),
            this.node,
            this.project,
            this.loader,
            this.stringTable
        );
        this.initTools();

        // 000 = ivy shrine
        // 006 = physics + guardians
        // 033 = water puzzle, missing polygon in corner
        // 051 = has lava and spikeballs
        // 099 = blessing

        this.shrineName = this.args.shrine ? this.args.shrine : "Dungeon000";
        let isAoc =
            (this.shrineName.includes("Dungeon") &&
                parseInt(this.shrineName.slice(-3)) > 119) ||
            (this.shrineName.includes("Remains") &&
                this.config.getValue("game.aocPath"));

        let shrinePath = isAoc
            ? path.join(
                  this.config.getValue("game.aocPath"),
                  "content",
                  "0010",
                  "Pack",
                  this.shrineName + ".pack"
              )
            : path.join(
                  this.config.getValue("game.basePath"),
                  "content",
                  "Pack",
                  this.shrineName + ".pack"
              );

        this.openShrine(shrinePath);
    }
};
