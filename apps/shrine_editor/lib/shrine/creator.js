/**
* @copyright 2018 - Max Bebök
* @author Max Bebök
* @license GNU-GPLv3 - see the "LICENSE" file in the root directory
*/

const fs   = require('fs-extra');
const path = require('path');

const BYAML = require("byaml-lib");
const SARC  = require("sarc-lib");
const yaz0  = require("yaz0-lib");

/**
 * Class to cteate shrines and save/generate all its data
 */
module.exports = class Shrine_Creator
{
    /**
     * @param {Actor_Handler} actorHandler 
     */
    constructor(actorHandler)
    {
        this.actorHandler = actorHandler;
    }

    /**
     * saves all shrine data, and optionally builds the .pack file
     * @param {string} shrineDir shrine base directory
     * @param {string} shrineName shrine name
     * @param {bool} packData if true, builds the .pack file
     */
    async save(shrineDir, shrineName, packData)
    {
        const packPath = shrineDir.replace(".unpacked", "");

        await Promise.all([
            this.saveActors("Dynamic", shrineDir, shrineName),
            this.saveActors("Static",  shrineDir, shrineName),
        ]);

        if(packData)
        {
            const sarc = new SARC();
            await sarc.fromDirectory(shrineDir);
            await sarc.save(packPath);
        }
    }

    /**
     * @param {string} typeName "Dynamic" or "Static"
     * @param {string} shrineDir shrine base directory
     * @param {string} shrineName shrine name
     */
    async saveActors(typeName, shrineDir, shrineName)
    {
        const actorPath = path.join(shrineDir, "Map", "CDungeon", shrineName, `${shrineName}_${typeName}.smubin`); 
        const byaml = new BYAML.Creator();
        const actorBuffer = byaml.create(typeName == "Dynamic" ? this.actorHandler.dataActorDyn : this.actorHandler.dataActorStatic);
        const actorYaz = yaz0.encode(actorBuffer);

        await fs.writeFile(actorPath, actorYaz);
    }
}