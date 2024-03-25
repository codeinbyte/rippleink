const searchNoteInput = document.getElementById('search-note');
const clearSearchInput = document.getElementById('clear-search-input');
let nodeArray=[];
let delaySearch;


clearSearchInput.addEventListener('click', function() {
  searchNoteInput.value = '';
  clearSearchInput.style.display = 'none';
  resetNodeArray();
});

// add event listener to detect changes on search input
searchNoteInput.addEventListener('input', function() {
  clearTimeout(delaySearch);

  // show/hide the button to clear search input
  clearSearchInput.style.display = searchNoteInput.value ? 'inline' : 'none';

  // if search character < 3, reset search
  if (searchNoteInput.value.length < 3) {
    resetNodeArray();
    return;
  }

  // delay search as long as user keep typing
  delaySearch = setTimeout(function() {
    searchNotes(searchNoteInput.value);
  }, 750);
});

function searchNotes(query) {
  resetNodeArray();
  const lowerCaseQuery = query.toLowerCase();
  const sidebarNotes = document.querySelectorAll('.sidebar-note-name');

  sidebarNotes.forEach((note) => {
    const noteTitle = note.textContent.trim().toLowerCase();

    if (!noteTitle.includes(lowerCaseQuery)) {
      noteContainer = note.parentNode.parentNode;
      noteContainer.classList.toggle('hidden');
      nodeArray.push(noteContainer);
    }
  });
}

function resetNodeArray() {
  nodeArray.forEach((element) => {
    element.classList.toggle('hidden');
  });
  nodeArray=[];
}
