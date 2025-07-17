mobile device screen issue:
logout modal
ledger book-> bill data amount modal

Holdings page stock wise distribution labels legends should be in scrollable y div to displaly all labls

- key points to consider while page creates with lot of data:
  Virtualization: Use a virtualized list to only render the rows that are visible on the screen. This reduces the number of DOM elements being created and improved performance. You might already be using a virtualized list, but ensure it's working correctly.

  Modal Optimization: Only render the modal when it is opened. Avoid keeping all the modals in the DOM at once if the page contains many rows. Use a state or a React Portal to render the modal only when it’s visible.
  {isModalOpen && <Modal close={closeModal} />}

  Lazy Load Modals: Only render the modal component when it's opened. If you are using a modal library, ensure you're not re-rendering it unnecessarily. Use React.lazy or React Suspense to load modals dynamically.
  <React.Suspense fallback={<div>Loading...</div>}>
  {isModalOpen && <LazyModal close={closeModal} />}
  </React.Suspense>

  Portal Usage: If the modal is inside the table, move it to a portal outside the DOM hierarchy of the table. This reduces layout recalculations and avoids blocking the table's rendering process.
  {isModalOpen &&
  ReactDOM.createPortal(
  <Modal close={closeModal} />,
  document.body // Move modal to the body instead of inside the table
  )}

  Debounce Events: If your event handlers are tied to actions that trigger frequent state changes (like sorting, filtering, or opening a modal), consider debouncing those events to limit the number of updates.
  const handleSort = debounce((columnId) => {
  table.getColumn(columnId).toggleSorting();
  }, 300); // 300ms delay
  return ( <button onClick={() => handleSort(column.id)}>Sort</button>);

scrip name main column, hiddden column as scrip symbol n isin,,,,,,, for all anuual pl reports

selectm multiple for view columns

charts legends should be in left

/branch,,,, clientID

hidden columns to remove and unselected in view columns
