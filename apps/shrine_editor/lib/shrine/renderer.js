/**
* @copyright 2018 - Max Bebök
* @author Max Bebök
* @license GNU-GPLv3 - see the "LICENSE" file in the root directory
*/

const Renderer = requireGlobal("lib/3d_renderer/renderer");
const HTML_Loader = requireGlobal("lib/html_loader");
const Actor_GUI = require("./../actor/gui");

module.exports = class Shrine_Renderer
{
    /**
     * @param {Node} canvasNode canvas to draw to
     * @param {Node} uiNode node that contains all ui elements
     * @param {Loader} loader
     */
    constructor(canvasNode, uiNode, loader)
    {
        this.canvasNode = canvasNode;
        this.uiNode = uiNode;
        this.loader = loader;

        this.actorObjectMap = {};
        this.clear();
    }
        
    clear()
    {
        if(this.renderer != null)
            this.renderer.clear();

        this.renderer = new Renderer(this.canvasNode);
        this.renderer.changeCameraType('fps');
        this.renderer.camera.position.y = 5;
        
        this.selectedActorList = this.uiNode.querySelector(".container-selectedActors");

        this.actorGroup  = this.renderer.createObjectGroup("actors",  true);
        this.shrineGroup = this.renderer.createObjectGroup("shrine",  true);

        this.htmlActorEntry = new HTML_Loader('./html/selected_actor.html');

        this.renderer.updateDrawSize();
    }

    /**
     * sets the model for the shrine
     * @param {Object} models 
     */
    setShrineModels(models)
    {
        for(const model of Object.values(models))
        {
            for(const subModel of Object.values(model))
            {
                this.shrineGroup.add(this.renderer.createModel(subModel));
            }
        }
    }

    addActor(actor)
    {
        const objectGroup = actor.object.getGroup();
        
        if(objectGroup)
        {
            this.actorObjectMap[actor.id] = objectGroup;
            this.actorGroup.add(objectGroup);
        }
    }

    /**
     * removes an actor from the scene
     * @param {Actor} actor actor to remove
     */
    deleteActor(actor)
    {
        if(this.actorObjectMap[actor.id])
        {
            this.actorGroup.remove(this.actorObjectMap[actor.id]);
            delete this.actorObjectMap[actor.id];
        }
    }

    selectActor(actor)
    {
        let actorNode = this.htmlActorEntry.create();
        this.selectedActorList.appendChild(actorNode);
        const addedChild = this.selectedActorList.children[this.selectedActorList.children.length-1]; // only way to get a correct reference
        actor.gui = new Actor_GUI(actor, addedChild, this.loader);
        actor.gui.update();
    }

    deselectActor(actor)
    {
        if(actor.gui)
            this.selectedActorList.removeChild(actor.gui.node);
    }

    start()
    {
        this.renderer.start();
    }

    stop()
    {
        this.renderer.stop();
    }
}
