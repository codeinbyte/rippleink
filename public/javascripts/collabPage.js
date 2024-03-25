let drawingContent;
let collabIdValue = document.getElementById('collab_id').value;

// for socket.io unique clientOffset
let noteCounter = 0;  
let drawingCounter = 0;

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
  quickInsertEnabled: false,
  saveInterval: 2500,
  saveParam: 'text_content',
  saveURL: '/note/update-collab',
  saveMethod: 'POST',

  // Additional save params
  saveParams: {
    collab_id: collabIdValue,
    title: document.getElementById('collab_title').value,
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
    },

    'keydown': function () {
      const textContent = this.html.get();
      const clientOffset = `${socket.id}-note-${noteCounter++}`;
      socket.emit('note', textContent, clientOffset, collabIdValue);
    },

    // function is called everytime froala text editor content is changed
    'contentChanged': function () {
      const textContent = this.html.get();
      const clientOffset = `${socket.id}-note-${noteCounter++}`;
      socket.emit('note', textContent, clientOffset, collabIdValue);
      editor.save.save();
    },

    // function is called before saving
    'save.before': function () {
      // Update saveParams with the latest values
      let titleValue = document.getElementById('collab_title').value;
      editor.opts.saveParams.title = titleValue.trim() === '' ? 'Untitled' : titleValue;  // If title is empty, use 'Untitled'
      editor.opts.saveParams.collab_id = collabIdValue;

      // Get all the drawing data
      drawingContent = document.getElementById('drawing-content').innerHTML;
      editor.opts.saveParams.drawing_content = JSON.stringify(drawingContent);
    },

    // function is called after saving
    'save.after': function () {
      const updatedTitle = editor.opts.saveParams.title;
      const element = document.getElementById(collabIdValue);

      // Update sidebar collab title
      element.textContent = updatedTitle;
    },
  }
});

// socket.io client receive message
socket.on('note', async (msg, serverOffset) => {
  const textbox = document.querySelector('.fr-element.fr-view');
  textbox.innerHTML = msg;
  // editor.html.set(msg);

  textbox.blur();
  socket.auth.serverOffset = serverOffset;
});

// Event listener, update title on changes
const titleInput = document.getElementById('collab_title');
titleInput.addEventListener('input', function() {
  editor.save.save();
  socket.emit('title_change', titleInput.value, collabIdValue);
});

// socket.io client receive title change
socket.on('title_change', async (title, collabIdValue) => {
  titleInput.value = title;
});

const svgDrawingArea = document.getElementById('drawing-content');
const svgDrawingEvent = document.getElementById('drawing_event');

// Event listener to send drawing through socket.io on hidden input change
svgDrawingEvent.addEventListener('input', function() {
  const clientOffset = `${socket.id}-drawing-${drawingCounter++}`;
  socket.emit('drawing', svgDrawingArea.innerHTML, clientOffset, collabIdValue);
});

// socket.io client receive drawing
socket.on('drawing', async (svgPath, serverOffset) => {
  svgDrawingArea.innerHTML = svgPath;
  socket.auth.serverOffset = serverOffset;
});
