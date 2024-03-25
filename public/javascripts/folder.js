async function createNewFolder(folderName) {
  const data = {'folderName': folderName};
  const response = await fetch('/note/create-new-folder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();

  if (result) {
    location.reload();
  }
}

async function deleteFolder(folderId) {
  const data = {'folderId': folderId};
  const response = await fetch('/note/delete-folder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();

  if (result) {
    location.reload();
  }
}

async function addNotesToFolderPopupWindow(folderId) {
  let result;
  try {
    const response = await fetch('/note/get-user-all-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    result = await response.json();
  } catch (error) {
    console.error('Error fetching collab note:', error.message);
  }

  let folderContent = "<div style='font-size: 17px;'>You have no notes.</div>";
  if (result) {
    folderContent = '';
    result.forEach((note) => {
      folderContent += "<div style='display: flex; flex-direction: row; width: 67%; margin: 0 auto;'>"+
                    "<div style='margin-bottom: 8px; margin-right: auto; font-size: 17px;"+
                    "overflow: hidden; text-overflow: ellipsis; max-width: 270px; white-space: nowrap;'>"+
                      note.title+
                    "</div>"+
                    "<input style='margin-bottom: 8px; margin-left: auto; transform: scale(1.4);' type='checkbox' class='note-to-add-to-folder' value='"+note._id+"'>"+
                    "</div>";
    });
  }

  popupMessage(
    "<div style='font-size: 17px;'>Select Notes to be added to folder:</div><br>" +
    "<div style='display: flex; flex-direction: column;'>"+
    folderContent+
    "</div>"+
    "<div id='add-notes-to-folder-button'><a href='#' onclick=\"addNotesToFolder('" + folderId + "')\">Add Notes</a></div>"
  );
}

async function addNotesToFolder(folderId) {
  let noteList=[];
  let checkedList = [];
  noteList = document.querySelectorAll('.note-to-add-to-folder');

  // Get all the checked notes id value
  noteList.forEach((note) => {
    if (note.checked) {
      checkedList.push(note.value);
    }
  });

  // If nothing is checked, return
  if (!checkedList.length > 0) return;

  const data = {'folderId': folderId, 'noteToInsert': checkedList};
  const response = await fetch('/note/update-folder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();

  if (result) {
    location.reload();
  }
}

async function removeNoteFromFolder(folderId, noteId) {
  const data = {'folderId': folderId, 'noteId': noteId};
  const response = await fetch('/note/delete-note-from-folder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();

  if (result) {
    location.reload();
  }
}
