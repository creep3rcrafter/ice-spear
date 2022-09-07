/**
 * @copyright 2018 - Max Bebök
 * @author Max Bebök
 * @license GNU-GPLv3 - see the "LICENSE" file in the root directory
 */

const electron = require("electron");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

const Split = require("split.js");
const { dialog } = electron.remote;

const Notify = requireGlobal("lib/notify/notify.js");
const Filter = requireGlobal("lib/filter.js");

const Field_Editor = require("./lib/field_editor.js");
const ActorParams = require("../../lib/mubin_editor/actor/params");
const Actor_Templates = require("../../lib/mubin_editor/actor/template");
const String_Table = requireGlobal("lib/string_table/string_table.js");
const extractField = require("./lib/field_extractor");
const extractStaticMubins = require("./lib/static_mubin_extractor");
const TitleBG_Handler = require("./../../lib/titlebg_handler");
const AocMainField_Handler = require("./../../lib/aoc_handler");

const App_Base = requireGlobal("apps/base.js");
const { clipboard } = require("electron");
const CONFIG_DIR = path.join(os.homedir(), ".ice-spear");
const userTemplateDir = path.join(CONFIG_DIR, "/templates");

module.exports = class App extends App_Base {
  constructor(window, args) {
    super(window, args);

    this.isAoc = !!this.config.getValue("game.aocPath");
    this.fieldGamePath = this.isAoc
      ? path.join(
          this.config.getValue("game.aocPath"),
          "content",
          "0010",
          "Map",
          "MainField"
        )
      : path.join(
          this.config.getValue("game.updatePath"),
          "content",
          "Map",
          "MainField"
        );
    this.fieldStaticGamePath = path.join(
      this.config.getValue("game.updatePath"),
      "content",
      "Physics",
      "StaticCompound",
      "MainField"
    );

    this.fieldDir = null;
    this.fieldSection = null;

    this.footerNode = footer.querySelector(".data-footer");

    this.stringTable = new String_Table(this.project.getCachePath());

    Split(["#main-sidebar-1", "#main-sidebar-2", "#main-sidebar-3"], {
      sizes: [15, 65, 20],
      minSize: 0,
      snapOffset: 60,
      gutterSize: 12,
    });

    this.initTools();
  }

  initTools() {
    this.node.querySelector(".data-tool-save").onclick = () => this.save();
    this.node.querySelector(".data-tool-openFieldDir").onclick = () => {
      electron.shell.showItemInFolder(this.fieldEditor.getFieldFilePath());
    };
    this.node.querySelector(".data-tool-buildTemplate").onclick = () =>
      this.buildTemplate();

    this.node.querySelector(".data-tool-packStatic").onclick = () =>
      this.packStatic();
    this.node.querySelector(".data-tool-openTitleBgDir").onclick = () => {
      electron.shell.showItemInFolder(
        path.join(this.project.getPath(), "TitleBG.pack")
      );
    };

    this.node.querySelector(".data-tool-addActorStatic").onclick = async () => {
      this.fieldEditor.actorHandler.addFromData(
        ActorParams.createTemplate("FldObj_HugeMazeTorchStand_A_01"),
        "Static"
      );
    };

    this.node.querySelector(".data-tool-addActorDyn").onclick = async () => {
      this.fieldEditor.actorHandler.addFromData(
        ActorParams.createTemplate("FldObj_HugeMazeTorchStand_A_01"),
        "Dynamic"
      );
    };

    Actor_Templates.getHtmlSelect().then(
      (html) =>
        (this.node.querySelector(".data-tool-actorTemplate").innerHTML = html)
    );

    this.node.querySelector(".data-tool-addActorTemplate").onclick =
      async () => {
        const templateName = this.node.querySelector(
          ".data-tool-actorTemplate"
        ).value;
        this.fieldEditor.actorHandler.addFromTemplate(templateName);
      };
  }

  /**
   * Template Builder
   * Im aware this code is crap but ill fix it later.
   */
  async buildTemplate() {
    await this.loader.setStatus("Building Template");
    await this.loader.show();

    if (this.fieldEditor.actorEditor.selectedActors == 0) {
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
        i < this.fieldEditor.actorEditor.selectedActors.length;
        i++
      ) {
        JSONObject = JSON.parse(
          this.fieldEditor.actorEditor.selectedActors[i].getParamJSON()
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
   * saves the field
   */
  async save() {
    await this.loader.setStatus("Saving Field");
    await this.loader.show();

    await this.fieldEditor.save();

    await this.loader.hide();
    Notify.success(`Field '${this.fieldSection}' saved`);
  }

  async packStatic() {
    await this.loader.setStatus("Packing static maps");
    await this.loader.show();

    await this.fieldEditor.titleBgHandler.pack();

    await this.loader.hide();
    Notify.success(`Static maps packed`);
  }

  async openField(fieldSection, fieldPos = undefined) {
    this.fieldSection = fieldSection;

    await this.loader.show();
    await this.loader.setStatus("Loading Field");
    try {
      this.stringTable.loader = this.loader;
      //await this.stringTable.load(); // not needed now, yay!

      if (typeof global.gc == "function")
        // free some memory after maybe loading the stringtable
        global.gc();

      this.fieldDir = path.join(
        this.project.getFieldPath("data"),
        this.fieldSection
      );
      const alreadyOpened = await fs.pathExists(this.fieldDir);
      await fs.ensureDir(this.fieldDir);

      await this.loader.setStatus("Extracting Static Maps");
      await extractStaticMubins(
        this.config.getValue("game.aocPath") ||
          this.config.getValue("game.basePath"),
        this.project.getPath(),
        this.fieldDir,
        this.fieldSection
      );

      if (!alreadyOpened) {
        await extractField(
          this.fieldGamePath,
          this.fieldStaticGamePath,
          this.fieldDir,
          this.fieldSection
        );
      }

      await this.loader.setStatus("Loading Field");
      await this.fieldEditor.load(this.fieldDir, this.fieldSection, fieldPos);

      this.render();

      // some performance cuts
      this.fieldEditor.setRenderSetting("targetFPS", "number", 30);
      this.fieldEditor.setRenderSetting("camSpeed", "number", 2);
      //this.fieldEditor.setRenderSetting("accurateTimer", "bool", true);
    } catch (e) {
      await this.loader.hide();
      console.log(e);
      throw e;
    }

    await this.loader.hide();
  }

  render() {
    this.footerNode.innerHTML = "Loaded Field-Section: " + this.fieldDir;

    this.node.querySelector(".data-field-section").innerHTML =
      this.fieldSection;

    if (
      this.fieldEditor.actorHandler.dataActorStatic &&
      this.fieldEditor.actorHandler.dataActorStatic.Objs
    )
      this.node.querySelector(".data-actors-staticCount").innerHTML =
        this.fieldEditor.actorHandler.dataActorStatic.Objs.length;

    if (
      this.fieldEditor.actorHandler.dataActorDyn &&
      this.fieldEditor.actorHandler.dataActorDyn.Objs
    )
      this.node.querySelector(".data-actors-dynamicCount").innerHTML =
        this.fieldEditor.actorHandler.dataActorDyn.Objs.length;

    let prodNum = 0;
    for (const prodSection of this.fieldEditor.actorHandler.dataActorProd) {
      this.node.querySelector(".data-actors-prodCount-" + prodNum++).innerHTML =
        prodSection.length;
    }

    this.fieldEditor.start();
  }

  async run() {
    await super.run();

    let staticHandler;
    console.log(this);
    if (this.isAoc) {
      new AocMainField_Handler(
        this.config.getValue("game.aocPath"),
        this.project.getPath()
      );
      console.log("Aoc handler");
    } else {
      new TitleBG_Handler(
        this.config.getValue("game.updatePath"),
        this.project.getPath()
      );
      console.log("TitleBG handler");
    }
    this.fieldEditor = new Field_Editor(
      this.node.querySelector(".shrine-canvas"),
      this.node,
      this.project,
      this.loader,
      this.stringTable,
      staticHandler
    );

    let fieldSection = this.args.section ? this.args.section : "J-8";
    let fieldPos = this.args.pos ? this.args.pos : undefined;

    if (fieldPos) {
      fieldPos[0] = parseFloat(fieldPos[0]);
      fieldPos[1] = parseFloat(fieldPos[1]);
    }

    await this.openField(fieldSection, fieldPos);
  }
};
