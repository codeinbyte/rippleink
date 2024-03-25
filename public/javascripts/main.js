const sideBar = document.getElementById('sidebar');
const chatBar = document.getElementById('chatbar');

function toggleSidebar() {
  sideBar.style.display = (sideBar.style.display === 'inline-block') ? 'none' : 'inline-block';
}

function toggleSidebarNotelist(listNumber) {
  let listNum = document.getElementById('sidebar-list-'+listNumber);
  listNum.classList.toggle('hidden');
}

function toggleChatbar() {
  chatBar.style.display = (chatBar.style.display === 'inline-block') ? 'none' : 'inline-block';
}

async function createNote() {
  const response = await fetch('/note/create-new-note', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
  });
  const result = await response.json();

  if (result) {
    window.location.href = result.url;
  }
}

async function deleteNote(noteId) {
  const data = {'_id': noteId};
  const response = await fetch('/note/delete-note', {
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

async function createCollab(folderId='') {
  const data = {'folder_id': folderId};
  const response = await fetch('/note/create-new-collab', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (result) {
    window.location.href = result.url;
  }
}

async function deleteCollab(collabId) {
  const data = {'_id': collabId};
  const response = await fetch('/note/delete-collab', {
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

async function sharePersonalNotePopupWindow(noteId, publicUrl) {
  const label = "<label for='share-to-public'>Share to public</label>";
  if (!publicUrl) {
    popupMessage(label+
        "<input type='checkbox' id='share-to-public' name='share-to-public' onclick=\"togglePersonalNoteSharing('" + noteId + "')\">"+
        "<input type='text' id='share-link' name='share-link' value='"+ publicUrl +"' disabled>"
      );
  } else {
    popupMessage(label+
        "<input type='checkbox' id='share-to-public' name='share-to-public' onclick=\"togglePersonalNoteSharing('" + noteId + "')\" checked>"+
        "<input type='text' id='share-link' name='share-link' value='"+window.location.hostname+':3000/public-note/'+publicUrl +"' disabled>"
      );
  }
}

async function togglePersonalNoteSharing(noteId) {
  const data = {'_id': noteId};
  const response = await fetch('/note/share-personal-note', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  let hostname = (result.public_url) ? window.location.hostname+':3000/public-note/' : '';
  document.getElementById('share-link').value = hostname + result.public_url;
}

async function shareCollabNotePopupWindow(collabId) {
  popupMessage(
    "<label for='share-collab' style='font-size: 16px;'>Enter email to share note with:</label><br>" +
    "<input type='text' id='share-collab' name='share-collab'>"+
    "<div id='share-collab-button'><a href='#' onclick=\"collabSharing('" + collabId + "')\">Share</a></div>"+
    "<div style='font-size: 16px; margin-bottom: 8px;'>Shared user access: </div>"+
    "<div style='display: flex; flex-direction: row; justify-content: center;'>"+
      "<input type='radio' id='share-permission-view-only' name='sharePermission' value='view' checked>"+
      "<label style='font-size: 16px;' for='option1'>View Only</label><br>"+
      "<input style='margin-left: 35px;' type='radio' id='share-permission-view-and-edit' name='sharePermission' value='edit'>"+
      "<label style='font-size: 16px;' for='option1'>View and Edit</label><br>"+
    "</div>"+
    "<hr id='share-collab-divider' class='hidden'>"+
    "<table id='shared-user-list' class='hidden'>"+
      "<thead>"+
          "<tr>"+
              "<th>Shared Users</th>"+
              "<th>View</th>"+
              "<th>Edit</th>"+
              "<th>Remove</th>"+
          "</tr>"+
      "</thead>"+
      "<tbody id='shared-user'>"+
      "</tbody>"+
    "</table>"
  );

  const data = {'_id': collabId};
  try {
    const response = await fetch('/note/get-collab-note-by-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    const contentDiv = document.getElementById('shared-user');
    contentDiv.innerHTML = '';
    let canEditDivContent='';
    let canViewDivContent='';

    // Make the table that contains shared user list visible only if there is content
    if (Object.keys(result.can_edit_user_id).length !== 0 || Object.keys(result.can_view_user_id).length !== 0) {
      document.getElementById('shared-user-list').classList.toggle('hidden');
      document.getElementById('share-collab-divider').classList.toggle('hidden');
    }

    if (result.can_edit_user_id) {
      let counter=0;
      result.can_edit_user_id.forEach((sharedUserId) => {
        canEditDivContent+= "\
          <tr>\
            <td>"+result.canEditEmail[counter]+"</td>\
            <td><input type='radio' name='"+sharedUserId+"' value='view' onchange=\"changeCollabSharingPermission('" + collabId + "','" + sharedUserId + "', 'view')\"></td>\
            <td><input type='radio' name='"+sharedUserId+"' value='edit' onchange=\"changeCollabSharingPermission('" + collabId + "','" + sharedUserId + "', 'edit')\" checked></td>\
            <td>\
              <a class='button-small'\
                href='javascript:void(0)'\
                onclick=\"popupConfirmation('Remove shared user?', function() { removeCollabSharing('" + collabId + "','" + sharedUserId + "') });\">\
                <img src='/images/icons/delete.png' style='padding-top: 8px;'>\
              </a>\
            </td>\
          </tr>";
        counter++;
      });
    }

    if (result.can_view_user_id) {
      let counter=0;
      result.can_view_user_id.forEach((sharedUserId) => {
        canViewDivContent+= "\
          <tr>\
            <td>"+result.canViewEmail[counter]+"</td>\
            <td><input type='radio' name='"+sharedUserId+"' value='view' onchange=\"changeCollabSharingPermission('" + collabId + "','" + sharedUserId + "', 'view')\" checked></td>\
            <td><input type='radio' name='"+sharedUserId+"' value='edit' onchange=\"changeCollabSharingPermission('" + collabId + "','" + sharedUserId + "', 'edit')\"></td>\
            <td>\
              <a class='button-small'\
                href='javascript:void(0)'\
                onclick=\"popupConfirmation('Remove shared user?', function() { removeCollabSharing('" + collabId + "','" + sharedUserId + "') });\">\
                <img src='/images/icons/delete.png' style='padding-top: 8px;'>\
              </a>\
            </td>\
          </tr>";
        counter++;
      });
    }

    contentDiv.innerHTML = '<ul>'+canEditDivContent+canViewDivContent+'</ul>';

  } catch (error) {
    console.error('Error fetching collab note:', error.message);
  }
}

async function collabSharing(collabId) {
  const email = document.getElementById('share-collab').value;
  const sharedPermission = document.querySelector('input[name="sharePermission"]:checked').value;
  const data = {'email': email, '_id': collabId, 'sharedPermission': sharedPermission};

  const response = await fetch('/note/share-collab-note', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (result.acknowledged) {
    location.reload();
  } else {
    popupMessage(result.message);
  }
}

async function changeCollabSharingPermission(collabId, sharedUserId, newPermissionValue) {
  const data = {'_id': collabId, 'sharedUserId': sharedUserId, 'sharedPermission': newPermissionValue};
  const response = await fetch('/note/change-collab-sharing-permission', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
}

async function removeCollabSharing(collabId, sharedUserId) {
  const data = {'_id': collabId, 'sharedUserId': sharedUserId};
  const response = await fetch('/note/remove-collab-sharing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
}
