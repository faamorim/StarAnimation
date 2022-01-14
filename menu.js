function SelectTab(e, tabName) {

  var tabContents = document.getElementsByClassName("tab-content");
  for (var i = 0; i < tabContents.length; i++) {
    tabContents[i].className = tabContents[i].className.replace(" active", "");
  }

  var tabHeaders = document.getElementsByClassName("tab-header");
  for (i = 0; i < tabHeaders.length; i++) {
    tabHeaders[i].className = tabHeaders[i].className.replace(" active", "");
    //tabHeaders[i].innerText = tabHeaders[i].getAttribute('title').substring(0,3);
  }

  document.getElementById(tabName + "-tab").className += " active";
  e.currentTarget.className += " active";
  //e.currentTarget.innerText = e.currentTarget.getAttribute('title');
}

function menu()
{
  function stop_propagation(e) {
    e.stopPropagation();
  }
  // Shape
  {
    var numberInputs = document.getElementsByClassName("number-input");
    for (var i = 0; i < numberInputs.length; i++) {
      setInputFilter(numberInputs[i], function(value) {return /^\d*$/.test(value);});
      numberInputs[i].addEventListener("input", stop_propagation);
    }
  }

  // View
  {
    let view_tab_controls = document.getElementById("view-tab-controls");
    let advanced_toggle = document.getElementById("view-tab-toggle-advanced-controls");
    advanced_toggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        view_tab_controls.className += " advanced";
      }
      else {
        view_tab_controls.className = view_tab_controls.className.replace(" advanced", "");
      }
    });

    let dots_toggle = document.getElementById("view-dots");
    let circles_toggle = document.getElementById("view-circles");
    let small_toggle = document.getElementById('view-small-polygons');
    let large_toggle = document.getElementById('view-large-polygons');
    let path_toggle = document.getElementById('view-path');
    let star_toggle = document.getElementById('view-star');

    const event = new Event('change');
    document.addEventListener('keypress', (e) => {
      switch(e.key) {
        case 'd':
        dots_toggle.checked = !dots_toggle.checked;
        dots_toggle.dispatchEvent(event);
        break;
        case 'c':
        circles_toggle.checked = !circles_toggle.checked;
        circles_toggle.dispatchEvent(event);
        break;
        case 's':
        small_toggle.checked = !small_toggle.checked;
        small_toggle.dispatchEvent(event);
        break;
        case 'l':
        large_toggle.checked = !large_toggle.checked;
        large_toggle.dispatchEvent(event);
        break;
        case 'p':
        path_toggle.checked = !path_toggle.checked;
        path_toggle.dispatchEvent(event);
        break;
        case 'r':
        star_toggle.checked = !star_toggle.checked;
        star_toggle.dispatchEvent(event);
        break;
      }
    });
  }
}

window.addEventListener("load", menu);
