# KalidasaOCR Processing Tool

Tool to assist in processing OCR-ed text of [Works of Kalidasa Vol 1 - C. R. Devadhar](https://archive.org/details/dli.bengal.10689.15598).

## Usage Instructions
1. **Open the Tool**
	- Open [index.html](TODO:insert_link) in your browser.
2. **Load texts**
    - Load the sanskrit text in the left pane
    - Load the english text in the right pane
4. **Highlight text blocks**
    - Select a block of text from either of the panes and then press `Ctrl+Shift+S`. This highlights that block of text in either of the three colours - Yellow, Green, Blue - in that order.
    - Then you can either move on to the next block of text in the same pane or find a corresponding semantically similar block of text in the other pane and highlight it too.
    - A successful mapping is one where semantically similar text blocks from both the panes are highlighted in the same colour.
5. **Saving and Loading Projects**
    - Your current progress in the project can (and should) be saved locally. For this, just click on the 'Save Project' button in the top-right corner of the homepage. 
    - You can load an existing project from your PC by clicking on the 'Load Project' button in the top-right corner of the homepage. 
6. **Exporting mappings to JSON**
    - You can directly export your current sanskrit-english mappings to a JSON file by clicking on the 'Export JSON Map' button the top-right corner of the homepage.  

## Notes:
1. Text editing can be done directly in the text boxes by placing your cursor on the required location, regardless of whether that's in an existing highlight or not.
2. I truly recommend periodically saving your progress locally using the 'Save Project' button.
3. Every now and then, keep an eye on the "COUNT" notified on the title bar of each pane. This indicates the number of text blocks highligted for that particular pane. Make sure that both of these are in sync at the end of a successful mapping session.
4. You can delete mis-highlighted text blocks by clicking on the highlight and then pressing the [X] button that appears on top of the highlight, but be cautious that deleting a highlight box which has following highlights breaks the mapping counter syncronization across panes and will lead to unexpected behaviour. When this happens, I suggest using the provided Undo functionality to rever back to the last correct mapping and then starting again.


Please report any bugs or feature requests to @Sourav-Kulkarni (srvklkrn@gmail.com).

## License

See [LICENSE](LICENSE) for details.

