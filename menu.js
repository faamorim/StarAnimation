function SelectTab(e, tabName) {
  var tabContents = document.getElementsByClassName('tab-content');
  for (var i = 0; i < tabContents.length; i++) {
    tabContents[i].className = tabContents[i].className.replace(' active', '');
  }

  var tabHeaders = document.getElementsByClassName('tab-header');
  for (i = 0; i < tabHeaders.length; i++) {
    tabHeaders[i].className = tabHeaders[i].className.replace(' active', '');
    //tabHeaders[i].innerText = tabHeaders[i].getAttribute('title').substring(0,3);
  }

  document.getElementById(tabName + '-tab').className += ' active';
  e.currentTarget.className += ' active';
  //e.currentTarget.innerText = e.currentTarget.getAttribute('title');
}

(function LeftMenu() {
  // View
  {
    let view_tab_controls = document.getElementById('view-tab-controls');
    let control_hotkeys = new Object();
    function addControl(name, hotkey, checked, attributes){
      let name_start, name_hotkey, name_end;
      let index = -1;
      if (hotkey){
        index = name.indexOf(hotkey.toUpperCase());
        index = index >= 0 ? index : name.indexOf(hotkey.toLowerCase());
      }
      if (index >= 0){
        name_start = name.substring(0, index);
        name_hotkey = name.substring(index, index+1);
        name_end = name.substring(index+1);
      }
      else{
        name_start = name;
      }
      name = name.toLowerCase().replace(' ', '');
      function createElement(element, attributes) {
        let htmlelement = document.createElement(element);
        for(var key in attributes){
          htmlelement.setAttribute(key, attributes[key]);
        }
        return htmlelement;
      }
      function createSlider(parent, parent_name, label_text, label_class, control_class, control_id, property_name, control_min, control_max, control_step, control_value, control_list = null) {
        let control_element = createElement('label', {'for': control_id, 'class': ('advanced-control unselectable ' + (label_class ?? '')).trim()});
        parent.appendChild(control_element);
        control_element.appendChild(createElement('span', {'class': 'text'})).appendChild(document.createTextNode(label_text + ': '));
        control_element.appendChild(createElement('input', {'type': 'range', 'class': ('view-subcontrol ' + (control_class ?? '')).trim(), 'id': (control_id ?? ''), 'parent-control': parent_name, 'property': property_name, 'min': control_min, 'max': control_max, 'step': control_step, 'value': control_value, 'list': control_list}));
        return control_element;
      }

      function getControlValues(hierarchy, control) {
        let id_prefix = 'view-';
        let attribute = '';
        let value = attributes;
        if (hierarchy != null) {
          hierarchy = hierarchy.split('.');
          hierarchy.forEach((h) => {
            id_prefix += h + '-';
            attribute += h + '.';
            value = value[h];
          });
        }
        id_prefix += control+'-';
        attribute += control;
        value = value[control];
        return {'id': id_prefix, 'attribute': attribute, 'value': value};
      }

      function createAlphaSlider(parent, hierarchy = null) {
        let variables = getControlValues(hierarchy, 'alpha');
        return createSlider(parent, name, 'Alpha', 'color-alpha-control', 'alpha-control', variables.id + name, variables.attribute, 0, 1, 0.01, variables.value);
      }

      function createThicknessSlider(parent, hierarchy, prefix) {
        let variables = getControlValues(hierarchy, 'thickness');
        let label_text = prefix != null ? prefix + ' Thickness': 'Thickness';
        return createSlider(parent, name, label_text, null, null, variables.id + name, variables.attribute, 0, 20, 0.1, variables.value, 'line-width-datalist');
      }

      function createColorPicker(parent, hierarchy, prefix) {
        let variables = getControlValues(hierarchy, 'color');
        let control_element = createElement('label', {'for': variables.id + name, 'class': 'advanced-control color-control unselectable'});
        parent.appendChild(control_element);
        control_element.appendChild(createElement('span', {'class': 'text'})).appendChild(document.createTextNode('Color: '));
        control_element.appendChild(createElement('input', {'type': 'color', 'class': 'view-subcontrol', 'id': variables.id + name, 'parent-control': name, 'property': variables.attribute, 'value': variables.value}));
        return control_element;
      }

      function createCustom(parent, custom) {
        switch (custom.type) {
          case 'range':
          createSlider(parent, name, custom.label, null, null, 'view-' + name + '-' + custom.name, custom.name, custom.min, custom.max, custom.step, custom.value);
          break;
        }
      }

      let control_holder = createElement('li', {'class': 'view-control control-holder switch', 'id': 'view-' + name, 'control-name': name});
      view_tab_controls.appendChild(control_holder);
      let main_checkbox = createElement('input', {'type': 'checkbox', 'class': 'view-subcontrol enable-checkbox slider-checkbox', 'id': 'view-show-' + name, 'parent-control': name, 'property': 'visible'})
      if(checked) main_checkbox.setAttribute('checked', true);
      control_holder.appendChild(main_checkbox);
      let has_attributes = isObject(attributes);
      if (has_attributes) {
        let expand_checkbox = createElement('input', {'type': 'checkbox', 'class': 'expand-controls-checkbox', 'id': 'expand-view-' + name});
        control_holder.appendChild(expand_checkbox);
      }
      let main_label = createElement('label', {'for': 'view-show-' + name, 'class': 'control highlightable slider-label unselectable'});
      control_holder.appendChild(main_label);
      main_label.appendChild(createElement('span', {'class': 'slider-container'})).appendChild(createElement('span', {'class': 'slider'}));
      if (name_start) main_label.appendChild(document.createTextNode(name_start));
      if (name_hotkey) main_label.appendChild(document.createElement('u')).appendChild(document.createTextNode(name_hotkey));
      if (name_end) main_label.appendChild(document.createTextNode(name_end));
      if (name_hotkey) control_hotkeys[name_hotkey.toLowerCase()] = main_checkbox;
      if (has_attributes) {
        main_label.appendChild(createElement('label', {'for': 'expand-view-' + name, 'class': 'expand-controls-toggle'})).appendChild(createElement('span', {'class': 'expand-controls-arrow'}));
        let controls_expanded = createElement('div', {'class': 'view-tab-controls-expanded'});
        let controls_expanded_count = 0;
        control_holder.appendChild(controls_expanded);
        if (attributes.hasOwnProperty('custom')) {
          let custom_before = attributes.custom.filter((c) => c.position === 'before');
          custom_before.forEach((c) => {
            createCustom(controls_expanded, c);
            controls_expanded_count++;
          });
        }
        if (attributes.hasOwnProperty('color')) {
          let color_label = createColorPicker(controls_expanded);
          if (attributes.hasOwnProperty('alpha')) {
            createAlphaSlider(color_label);
          }
          controls_expanded_count++;
        }
        if (attributes.hasOwnProperty('thickness')) {
          createThicknessSlider(controls_expanded);
          controls_expanded_count++;
        }
        if (attributes.hasOwnProperty('center')) {
          let is_object = isObject(attributes.center);
          if (!is_object || attributes.center.hasOwnProperty('visible')) {
            let checkbox = createElement('input', {'type': 'checkbox', 'class': 'view-subcontrol slider-checkbox', 'id': 'view-center-show-' + name, 'parent-control': name, 'property': 'center.visible'});
            if((is_object && attributes.center.hasOwnProperty('visible') && attributes.center.visible) || (!is_object && attributes.center)) checkbox.setAttribute('checked', true);
            controls_expanded.appendChild(checkbox);
            let checkbox_label = createElement('label', {'for': 'view-center-show-' + name, 'class': 'advanced-control slider-label unselectable'});
            controls_expanded.appendChild(checkbox_label);
            checkbox_label.appendChild(createElement('span', {'class': 'text'})).appendChild(document.createTextNode('Show Center: '));
            checkbox_label.appendChild(createElement('span', {'class': 'slider-container'})).appendChild(createElement('span', {'class': 'slider'}))
            controls_expanded_count++;
          }
          if (is_object) {
            if (attributes.center.hasOwnProperty('color')) {
              let color_label = createColorPicker(controls_expanded, 'center');
              if (attributes.center.hasOwnProperty('alpha')) {
                createAlphaSlider(color_label, 'center');
              }
              controls_expanded_count++;
            }
            if (attributes.center.hasOwnProperty('thickness')) {
              createThicknessSlider(controls_expanded, 'center', 'Center');
              controls_expanded_count++;
            }
          }
        }
        if (attributes.hasOwnProperty('fill')) {

          controls_expanded_count++;
        }
        controls_expanded.setAttribute('max-height', controls_expanded_count);
      }
    }

    addControl('Dots', 'd', true, {'color': '#FF7800', 'alpha': 1, 'thickness': 20});
    addControl('Inner Circles', 'i', true, {'color': '#0000FF', 'alpha': 1, 'thickness': 8, 'center': {'visible': false, 'color': '#000000', 'alpha': '1', 'thickness': 10}});
    addControl('Small Polygons', 's', true, {'color': '#0000FF', 'alpha': 0.5, 'thickness': 15});
    addControl('Large Polygons', 'l', true, {'color': '#00FF00', 'alpha': 0.5, 'thickness': 15});
    addControl('Path', 'p', true, {'color': '#737373', 'alpha': 1, 'thickness': 3});
    addControl('Star', 'r', false, {'color': '#737373', 'alpha': 1, 'thickness': 3, 'custom' : [{'name': 'size', 'label': 'Size', 'position': 'before', 'type': 'range', 'min': 0, 'max': 1, 'step': 0.01, 'value': 0.5}]});
    addControl('Outer Circle', 'o', true, {'color' : '#0000FF', 'alpha': 1, 'thickness': 10});
    var expand_controls_checkbox = document.getElementsByClassName('expand-controls-checkbox');
    for (checkbox of expand_controls_checkbox) {
      checkbox.addEventListener('input', (e) => {
        if (e.target.checked){
          for(cb of expand_controls_checkbox) {
            if (cb != e.target){
              cb.checked = false;
            }
          }
        }
      });
    }

    const change_event = new Event('change');
    document.addEventListener('keypress', (e) => {
      let checkbox = control_hotkeys[e.key];
      if (checkbox != undefined){
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(change_event);
      }
    });
  }

  // Animations
  let addAnimationKeyframeElement;
  {
    let animation_keyframes_list = document.getElementById('animation-tab-keyframes');
    addAnimationKeyframeElement = function () {

    };
  }

  // Value display
  {
    function updateValue (display, source) {
      display.innerHTML = display.getAttribute('format').replace(/\\v/g, source.value);
    }
    let value_displays = [...document.getElementsByClassName('valuedisplay')];
    value_displays.forEach((display) => {
      let source = document.getElementById(display.getAttribute('valuesource'));
      if (source) {
        source.addEventListener('input', (e) => {updateValue(display, e.currentTarget)});
        updateValue(display, source);
      }
    });
  }
})();
