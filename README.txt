ScriptFilter version 3.1 by Baptiste Thémine

Blocks scripts and resources from a website with Content Security Policy.

ScriptFilter is a simple and lightweight add-on designed with WebExtensions API and compatible with Firefox, Chrome and Opera.
You just need to click on the add-on button or right-click in a page to block scripts in a tab.
You can access the Settings page via "about:addons" (Firefox), via "chrome://extensions" (Chrome & Opera) or via the action button context menu.
It permits you to decide which resources are blocked or restricted by Content Security Policy such as JavaScript, images, medias, subframes...
It is also possible to create a black list in order to block resources when you go to a specific website.

--------------------------------------------------------------------------------

ScriptFilter version 3.1 par Baptiste Thémine

Bloque les scripts et les ressources d'un site web avec Content Security Policy.

ScriptFilter est une extension simple et légère développée à l'aide de l'API WebExtensions et compatible avec les navigateurs Firefox, Chrome et Opera.
Il vous suffit de cliquer sur le bouton de l'extension ou cliquer-droit dans la page pour bloquer les scripts dans un onglet.
Vous pouvez accéder à la page Paramètres via "about:addons" (Firefox), via "chrome://extensions" (Chrome & Opera) ou via clic-droit sur le bouton de l'extension.
Elle vous permet de contrôler quelles ressources sont bloquées ou restreintes par Content Security Policy telles que JavaScript, les images, les médias, les subframes...
Il est également possible de créer une liste noire pour bloquer les ressources lorsque vous naviguer sur un site spécifique.

--------------------------------------------------------------------------------

Language support : English, French, Italian, Spanish.
Browser support : Firefox 52+, Firefox Android 57+, Chrome 42+, Opera 33+.

Updates :
* version 3.1 (25/03/2018)
- Fix CSP sandbox invalid option.
- Fix error on file import when no file is selected.
- Modify some i18n translations.
- CSS responsive improvements for large screens.
- Icon font improvements for Windows and Linux.
- Code and performance improvements.

* version 3.0 (12/01/2018)
- Add File section in Settings page.
- Add domain blacklist import from text file.
- Add domain blacklist export to text file.
- Add domain blacklist clear function.
- Modify the validation of input/imported domain urls with strict rule match and lower case conversion.
- Code improvements.

* version 2.1 (04/01/2018)
- Fix compatibility issue with Chromium PDF Viewer Plugin not working with CSP sandbox.
- Fix compatibility issue with Firefox not opening Google links with CSP sandbox.

* version 2.0 (02/01/2018)
- Fix issue with CSP not applying on Settings page if its tab url was modified.
- Fix issue with duplicate matching rules in blacklist which could prevent CSP to switch OFF.
- Fix compatibility issue with child-src/frame-src/worker-src in CSP level 1, 2 and 3.
- Fix compatibility issue with Chromium PDF Viewer Plugin not working with CSP sandbox.
- Add internationalization with i18n API.
- Add French, Italian and Spannish translations.
- Add a new option to add ScriptFilter to page context menu (no Firefox Android support).
- Add Settings to browserAction context menu for Firefox 53+.
- Add colors to CSP list items.
- Add alert messages for adding/removing urls in Domain Blacklist section.
- Modify the appearance of Settings page with two sections Settings and Domain Blacklist.
- CSS responsive improvements for mobile display.
- Code and performance improvements.

* version 1.0 (22/11/2017)
First version :)
