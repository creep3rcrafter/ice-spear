#  Ice-Spear - a Breath of the Wild Editor - Template Builder Version
![alt Ice-Spear](assets/icons/icon_256_thin.png)

For any information on how to use this, please see the Wiki: <br/>
https://gitlab.com/ice-spear-tools/ice-spear/wikis/home

Issues for bugs and features are inside the issue-repo: <br/>
https://gitlab.com/ice-spear-tools/issue-tracker/issues

### Whats New

- **How to use it**
  - Added a new build template button under the Tools section.
  - Simply select all the actors that you want.
  - Enter the Template name just use simple characters spaces will be replaced with `_`.
  - Then click build template .
  - The Template will be copied to your clipboard for you to paste
   into your templates folder at `C:\Users\user\.ice-spear\templates` in .json format.
  - Finally once you have created your template restart ice-spear
  <img src="https://github.com/creep3rcrafter/ice-spear/blob/Template-Builder/assets/img/Demo.gif">
  
- **Notes**
  - The first Actor you select be the center point for the template
  other Actors local postion will be based off the first selected.
  - If any linked Actors werent selected they will have to be 
  manualy removed or added in the template and will have an `Unknown` HashID.
  - If linked Actors have been selected any refrences will be set to the correct `{ID#}` HashID.
  - If you have issues please report them.

### Project Setup

- **Windows**
  - Pay attention to the use of `nvm` and `npm`
  - Install the latest [NVM for Windows](https://github.com/coreybutler/nvm-windows/releases)
  - Open cmd as admin and run `nvm install 14.19.3`
  - Then run `nvm use 14.19.3` 
  - Next run `npm install -d node-gyp@latest`
  - Next run `npm install --global yarn`
  - Next either open a new CMD in the location you wish to clone Ice-Spear to, or cd to that location.
  - Before building, `cd` into the root directory (the folder named `ice-spear` if you cloned)
  - Now run `yarn` and your project should be set up.

### Building and Running

- **For all**
  - CD to the `./ice-spear` dir that you cloned or copyed the project.
- **Running without building**
  - run `npm run start` and it should open the app
- **Building Uncompressed**
  - run `npm run unpacked` and it should build an .exe to use at `.\ice-spear\dist\win-unpacked\Ice-Spear.exe`
- **Building Compressed Release**
  - run `npm run dist` and it should build a compressed version for 
  release at `.\ice-spear\dist\Ice-Spear-#.#.#-win.7z`

### License
___
Licensed under GNU GPLv3.  
For more information see the LICENSE file in the project's root directory
