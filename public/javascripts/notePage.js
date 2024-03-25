let drawingContent;

// Froala custom table button
FroalaEditor.DefineIcon('customTable', {NAME: 'customTable', SVG_KEY: 'insertTable'});
FroalaEditor.RegisterCommand('customTable', {
  title: 'Table',
  focus: true,
  undo: true,
  refreshAfterCallback: false,
  callback: function () {
    this.table.insert(2, 2);
  }
});

// Froala custom drawing button
FroalaEditor.DefineIcon('customDraw', {NAME: 'customDraw', SVG_KEY: 'imageManager'});
FroalaEditor.RegisterCommand('customDraw', {
  title: 'Toogle Drawing Visibility',
  focus: true,
  undo: true,
  refreshAfterCallback: false,
  callback: function () {
    showHideDrawing();
  }
});

// To initiate Froala text editor
let editor = new FroalaEditor('textarea#froala-editor', {
  // SaveParam for note content
  saveParam: 'text_content',
  saveURL: '/note/update-note',
  saveMethod: 'POST',

  // Additional save params
  saveParams: {
    note_id: document.getElementById('note_id').value,
    title: document.getElementById('note_title').value,
    drawing_content: drawingContent,
  },

  toolbarStickyOffset: 48,
  toolbarButtons: [
    ['bold', 'italic', 'underline', 'strikeThrough'],
    ['fontSize', 'textColor', 'backgroundColor'],
    ['paragraphFormat', 'align', 'customTable'],
    ['customDraw']
  ],

  toolbarButtonsXS: {
    'moreText': {
      buttons: ['bold', 'italic', 'underline', 'strikeThrough'],
      'buttonsVisible': 0
    },

    'moreFont': {
      buttons: ['fontSize', 'textColor', 'backgroundColor'],
      'buttonsVisible': 3
    },

    'moreParagraph': {
      buttons: ['paragraphFormat', 'align', 'customTable'],
      'buttonsVisible': 0
    },

    'moreDraw': {
      buttons: ['customDraw'],
      'buttonsVisible': 1
    },
  },

  enter: FroalaEditor.ENTER_BR,
  tabSpaces: 4,

  events: {
    'initialized': function () {
      editor.html.set(document.getElementById("text_content").value);
      const script = document.createElement('script');
      script.src = '/javascripts/drawing.js';
      document.body.appendChild(script);

      document.querySelector('#save-note').addEventListener("click", function () {
        updateParamsAndSave();
      })
    },

    'contentChanged': function () {
      updateParamsAndSave();
    },

    'save.after': function () {
      const noteId = editor.opts.saveParams.note_id;
      const updatedTitle = editor.opts.saveParams.title;
      const element = document.getElementById(noteId);
      element.textContent = updatedTitle;
    },
  }
});

function updateParamsAndSave() {
  // Update saveParams with the latest values
  let titleValue = document.getElementById('note_title').value;
  editor.opts.saveParams.title = titleValue.trim() === '' ? 'Untitled' : titleValue;  // If title is empty, use 'Untitled'
  editor.opts.saveParams.note_id = document.getElementById('note_id').value;

  // Get all the drawing data
  drawingContent = document.getElementById('drawing-content').innerHTML;
  editor.opts.saveParams.drawing_content = JSON.stringify(drawingContent);

  editor.save.save();
}

const svgDrawingEvent = document.getElementById('drawing_event');
svgDrawingEvent.addEventListener('input', function() {
  updateParamsAndSave();
});