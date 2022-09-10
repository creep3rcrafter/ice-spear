/**
 * @copyright 2018 - Max Bebök
 * @author Max Bebök
 * @license GNU-GPLv3 - see the "LICENSE" file in the root directory
 */

const path = require("path");

const Mubin_Editor = require("./../../../lib/mubin_editor/editor");
const Field_Model_Loader = require("./field/model_loader");
const Field_Creator = require("./field/creator");
const Terrain = require("./../../../lib/terrain/terrain");
const Section_Helper = require("./../../../lib/terrain/section_helper");

module.exports = class Field_Editor extends Mubin_Editor {
    /**
     * @param {Node} canvasNode
     * @param {Node} uiNode
     * @param {Project_Manager} project
     * @param {Loader} loader
     * @param {stringTable} stringTable optional string table object
     */
    constructor(
        canvasNode,
        uiNode,
        project,
        loader,
        stringTable,
        titleBgHandler
    ) {
        super(canvasNode, uiNode, project, loader, stringTable);

        this.titleBgHandler = titleBgHandler;

        this.loadActorData = true;
        this.loadProdData = false;
        this.loadMapMesh = this.project
            .getConfig()
            .getValue("fieldEditor.loadModel");

        this.fieldModelLoader = new Field_Model_Loader();
        this.fieldCreator = new Field_Creator(
            this.actorHandler,
            this.project,
            this.titleBgHandler
        );

        this.terrain = new Terrain(
            project,
            this.getRenderer().renderer.context,
            this.loader
        );
    }

    /**
     * maps the actory type to the actual mubin location, this will differ between shrines and the main-field
     * @param {string} actorType
     */
    generateMubinPath(actorType) {
        return path.join(
            this.mubinDir,
            `${this.mubinName}_${actorType}.smubin`
        );
    }

    /**
     * maps the prod type to the actual prod location, this will differ between shrines and the main-field
     * @param {string} prodNum
     * @returns {string|undefined}
     */
    generateProdPath(prodNum) {
        const prodPrefixes = ["00", "01", "10", "11"];
        if (prodNum < prodPrefixes.length) {
            return path.join(
                this.mubinDir,
                `${this.mubinName}.${prodPrefixes[prodNum]}_Clustering.sblwp`
            );
        }
        return undefined;
    }

    /**
     * loads the map model (field or shrine)
     */
    async loadMapModel() {
        if (this.loadMapMesh) {
            this.fieldModelLoader.loader = this.loader;
            const fieldMeshArray = await this.fieldModelLoader.load(
                this.mubinDir,
                this.mubinName,
                this.terrain
            );

            for (const mesh of fieldMeshArray)
                this.mubinRenderer.setTerrainModel(mesh);
        }
    }

    /**
     * Load a field and it's models, textures, actors and other stuff
     * @param {string} directory directory of the field
     * @param {string} name name of the field
     * @param {Tuple<number,number>|undefined} fieldPos
     */
    async load(directory, name, fieldPos = undefined) {
        console.time("Editor-Load");
        await super.load(directory, name);
        console.timeEnd("Editor-Load");

        // jump the camera to the mid-point
        const cam = this.getRenderer().camera;
        const midPos = Section_Helper.getSectionMidpoint(name);

        cam.position.x = midPos.x;
        cam.position.y = midPos.y;
        cam.position.z = midPos.z;

        if (fieldPos) {
            cam.position.x = fieldPos[0];
            cam.position.z = fieldPos[1];
        }
    }

    /**
     * returns the project field path
     * @returns {string}
     */
    getFieldFilePath() {
        return path.join(this.mubinDir, this.mubinName);
    }

    /**
     * saves all field related data
     * @param {bool} rebuild if true, it rebuilds the .pack file
     */
    async save() {
        return await this.fieldCreator.save(this.mubinDir, this.mubinName);
    }
    async saveModLocation() {
        return await this.fieldCreator.save(this.project.path, this.mubinName);
    }
};
