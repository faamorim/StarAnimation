var addKeyframe, removeKeyframe;
(function() { document.addEventListener('DOMContentLoaded', (event) => {

  // Support Methods
  function cos_sin(wave, mult = 1, add = 0, invert = false, invertxy = false) {
    let x, y;
    if(Array.isArray(add)){
      x = !invertxy ? add[0] : add[1];
      y = !invertxy ? add[1] : add[0];
    }
    else{
      x = add;
      y = add;
    }
    wave = invert ? wave + 0.25 : wave;
    let cos = Math.cos(wave * 2 * Math.PI) * mult + x;
    let sin = Math.sin(wave * 2 * Math.PI) * mult + y;
    return invert ? [sin, cos] : [cos, sin];
  }
  let percent = 0;

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  console.log(params.label);

  const main_canvas = document.getElementById('canvas');;
  const main_ctx = main_canvas.getContext('2d');
  const draft_background_canvas = new OffscreenCanvas(1000, 1000);
  const draft_background_ctx = draft_background_canvas.getContext('2d');
  const draft_foreground_canvas = new OffscreenCanvas(1000, 1000);
  const draft_foreground_ctx = draft_foreground_canvas.getContext('2d');
  const static_canvas = new OffscreenCanvas(1000, 1000);
  const static_ctx = static_canvas.getContext('2d');
  const animation_canvas = new OffscreenCanvas(1000, 1000);
  const animation_ctx = animation_canvas.getContext('2d');

  function setCanvasSize(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
  }


  let static_update = true;

  // Size Control and Variables
  let scale = 1;
  let canvas_size, canvas_center, main_radius;
  (function() {
    let export_resolution_input = document.getElementById('export-resolution');
    let preview_export_size_input = document.getElementById('preview-export-size');
    window.addEventListener('resize', resizeCanvas, false);
    function resizeCanvas() {
      let base_size = 1000;
      let parent = main_canvas.parentElement;
      let width = parent.offsetWidth;
      let height = parent.offsetHeight;
      let size = Math.min(width, height);
      let preview_export_size = preview_export_size_input.checked;
      let export_resolution = parseInt(export_resolution_input.value);
      canvas_size = preview_export_size ? export_resolution : Math.max(size, base_size);
      scale = canvas_size / base_size;
      setCanvasSize(main_canvas, canvas_size, canvas_size);
      setCanvasSize(draft_background_canvas, canvas_size, canvas_size);
      setCanvasSize(draft_foreground_canvas, canvas_size, canvas_size);
      setCanvasSize(static_canvas, canvas_size, canvas_size);
      setCanvasSize(animation_canvas, canvas_size, canvas_size);
      main_canvas.style.width = (preview_export_size ? export_resolution : size) + 'px';
      main_canvas.style.height = (preview_export_size ? export_resolution : size) + 'px';
      canvas_center = [canvas_size/2, canvas_size/2];
      main_radius = canvas_size/2 * 0.8;
      static_update = true;
    }
    export_resolution_input.addEventListener('input', resizeCanvas);
    preview_export_size_input.addEventListener('input', resizeCanvas);
    resizeCanvas();
  })();

  // Shape Control and Variables
  let larger, smaller;
  let distance, star_size;
  let base_points, base_circles, circle_radius_ratio, base_star_vertices, star_edges;
  (function() {
    let number_a = document.getElementById('number-a');
    let number_b = document.getElementById('number-b');
    let distance_control = document.getElementById('distance');
    let star_size_control = document.getElementById('view-star-size');
    //let label = document.getElementById('star-label');

    function get_a() {
      return parseInt(number_a.value);
    }
    function set_a(val) {
      number_a.value = val;
    }
    function get_b() {
      return parseInt(number_b.value);
    }
    function set_b(val) {
      number_b.value = val;
    }
    function set_b_max(val) {
      number_b.setAttribute('max', val);
    }

    function update_star(a = get_a(), b = get_b()) {
      if (!a || !b) return;
      percent = 0;
      base_points = [];
      base_circles = [];
      base_star_vertices = [];
      star_edges = [];
      let p = Math.max(a, b);
      let q = Math.min(a, b);

      circle_radius_ratio = q/p;

      for(var i = 0; i < p; i++) {
        base_star_vertices[i] = cos_sin(i / p);
        star_edges[i] = (i + q) % p;
      }
      for(var i = 0; i < p-q; i++) {
        base_circles[i] = i / (p - q);
      }
      for(var i = 0; i < q; i++) {
        base_points[i] = i / q;
      }
      larger = p;
      smaller = q;
      static_update = true;
    }
    update_star(get_a(), get_b());

    function update_path(){
      distance = parseFloat(distance_control.value);
      star_size = parseFloat(star_size_control.value);
      static_update = true;
    }
    update_path();

    function update_label(){
      let a = get_a();
      let b = get_b();
      if (!a || a < 2) {
        a = 2;
        set_a(a);
      }
      if (!b || b < 1) {
        b = 1;
        set_b(b);
      }
      let b_max = Math.floor(a/2);
      if (b >= a) {
        b = b_max;
        set_b(b);
      }
      if (b > b_max) {
        b = a - b;
        set_b(b);
      }
      set_b_max(b_max);
      update_star(a, b);
    }


    number_a.addEventListener('change', update_label);
    number_b.addEventListener('change', update_label);
    distance_control.addEventListener('input', update_path);
    star_size_control.addEventListener('input', update_path);
    if (params.label != null) {
      let label_param = params.label.split(',');
      if (label_param.length == 2 && Number.isInteger(parseInt(label_param[0])) && Number.isInteger(parseInt(label_param[1]))) {
        set_a(parseInt(label_param[0]));
        set_b(parseInt(label_param[1]));
        update_label();
      }
    }
  })();


  // View Control and Variables
  let styles;
  (function() {
    styles = new Object();
    let static_names = ['outercircle','innercircles','star','path'];
    function registerAllViewControls() {
      let view_controls = document.getElementsByClassName('view-control');
      let view_subcontrols = [...document.getElementsByClassName('view-subcontrol')];
      for (let i = 0; i < view_controls.length; i++) {
        let control_name = view_controls[i].getAttribute('control-name')
        let subcontrols = view_subcontrols.filter(function (subcontrol){
          return subcontrol.getAttribute('parent-control') == control_name;
        });
        subcontrols.forEach((subcontrol) => {
          registerViewInput(subcontrol);
        });
      }
    }
    function registerViewInput(element) {
      let name = element.getAttribute('parent-control');
      let hierarchy = element.getAttribute('property').split('.');
      if (element != null) {
        let target = styles[name];
        if (target == null) {
          styles[name] = target = new Object();
        }
        let property = hierarchy[0];
        for (let i = 1; i < hierarchy.length; i++) {
          target = target[property] ?? (target[property] = new Object());
          property = hierarchy[i];
        }
        let type = element.getAttribute('type');
        switch (type) {
          case 'checkbox':
          registerViewSwitch(element, name, target, property);
          break;
          case 'color':
          registerViewValue(element, name, target, property);
          break;
          case 'range':
          registerViewSlider(element, name, target, property);
          break;
        }
      }
    }
    function registerViewSwitch(element, name, target, property) {
      target[property] = element.checked;
      element.addEventListener('change', function(e) {
        if (static_names.includes(name)) static_update = true;
        target[property] = element.checked;
      });
    }
    function registerViewValue(element, name, target, property) {
      target[property] = element.value;
      element.addEventListener('input', function(e) {
        if (static_names.includes(name)) static_update = true;
        target[property] = element.value;
      });
    }
    function registerViewSlider(element, name, target, property) {
      target[property] = parseFloat(element.value);
      element.addEventListener('input', function(e) {
        if (static_names.includes(name)) static_update = true;
        target[property] = parseFloat(element.value);
      });
    }

    registerAllViewControls();
  })();

  // Animation Control Variables
  let animation_speed, animation_preview, keyframes, updatePreviewOptions, getTransitionStyle;
  (function() {
    let speed_control = document.getElementById('animation-speed');
    let preview_control = document.getElementById('animation-preview');
    let preview_animation_option = document.getElementById('animation-preview-animation');
    keyframes = [];
    function update_speed() {
      let speed_control_value = parseFloat(speed_control.value);
      animation_speed = Math.pow(speed_control_value,2) * Math.sign(speed_control_value);
    }
    function update_preview() {
      animation_preview = preview_control_value = preview_control.value;
    }
    updatePreviewOptions = function() {
      if (keyframes.length == 0) {
        preview_control.selectedIndex = 0;
        preview_animation_option.disabled = true;
      }
      else {
        preview_animation_option.disabled = false;
      }
    }
    updatePreviewOptions();
    update_speed();
    update_preview();

    speed_control.addEventListener('input', update_speed);
    preview_control.addEventListener('input', update_preview);

    let masterFrameStyles = new Object();

    function updateMasterFrameStyles(style, master = masterFrameStyles) {
      for (let prop in style) {
        if (isObject(style[prop])) {
          if (!isObject(master[prop])) master[prop] = new Object();
          updateMasterFrameStyles(style[prop], master[prop]);
        }
        else master[prop] = typeof(style[prop]);
      }
    }

    function transitionValue (current, next, progress) {
      return (1 - progress) * current + progress * next;
    }

    function setTransitionProperty(property, current, next, transition, progress, master) {
      if (current[property] == next[property]) {
        transition[property] = current[property];
      }
      else if (!isNaN(current[property]) && !isNaN(next[property])) {
        transition[property] = transitionValue(current[property], next[property], progress);
      }
      else if (isColor(current[property]) && isColor(next[property])) {
        let currentColor = hexToRgb(current[property]);
        let nextColor = hexToRgb(next[property]);
        let r = transitionValue(currentColor.r, nextColor.r, progress).toFixed();
        let g = transitionValue(currentColor.g, nextColor.g, progress).toFixed();
        let b = transitionValue(currentColor.b, nextColor.b, progress).toFixed();
        let transitionColor = rgbToHex(r,g,b);
        transition[property] = transitionColor;
      }
      else if (isObject(current[property]) && isObject(next[property])) {
        transition[property] = new Object();
        for (let prop in master[property]) {
          setTransitionProperty(prop, current[property], next[property], transition[property], progress, master[property]);
        }
      }
      else {
        transition[property] = current[property] ? current[property] : next[property];
      }
    }

    getTransitionStyle = function(currentStyle, nextStyle, progress) {
      if (progress == 0) return currentStyle;
      if (progress == 1) return nextStyle;
      let style = new Object();
      for (let property in masterFrameStyles) {
        setTransitionProperty(property, currentStyle, nextStyle, style, progress, masterFrameStyles);
      }
      return style;
    }

    function fixVisibility(style, clear = false) {
      clear |= (style.hasOwnProperty('visible') && !style.visible) ? true : false;
      for (let property in style) {
        if (isObject(style[property])) fixVisibility(style[property], clear);
        else {
          if (clear) {
            if (property == 'visible') style[property] = true;
            else if (property == 'alpha') style[property] = 0;
            else delete style[property];
          }
        }
      }
      return style;
    }

    addKeyframe = function() {
      let keyframe = new Object();
      keyframe.styles = fixVisibility(JSON.parse(JSON.stringify(styles)));
      keyframe.duration = 1.5;
      keyframe.transition = 0.5;
      keyframes.push(keyframe);
      updateMasterFrameStyles(keyframe.styles);
      updatePreviewOptions();
    }

    removeKeyframe = function(index) {
      keyframes.splice(index, 1);
      updatePreviewOptions();
    }
  })();

  // Calculate
  let prev_points, points, circles, circle_radius, star_vertices, path_points, calculate_static, calculate;
  (function() {
    calculate_static = function() {
      if (points != null) {
        prev_points = points;
      }
      points = [];
      circles = [];
      circle_radius = main_radius * circle_radius_ratio;
      star_vertices = [];
      let size = (main_radius - circle_radius + circle_radius * (distance + (1 - distance) * star_size));
      base_star_vertices.forEach((e, i) => {
        star_vertices[i] = [canvas_center[0] + e[0] * size, canvas_center[1] + e[1] * size];
      });
      if (prev_points == null) {
        prev_points = points;
      }
    }
    calculate_static();
    calculate = function(percentage) {
      let diff = main_radius - circle_radius;
      base_circles.forEach((c, i) => {
        circles[i] = cos_sin(c - percentage, diff, canvas_center);
        points[i] = [];
        base_points.forEach((p, j) => {
          points[i][j] = cos_sin(p - (larger - smaller) / smaller * percentage, circle_radius * distance, circles[i], true, true);
        });
      });
      path_points = [];
      let steps = 100;
      for (var i = 0; i <= steps; i++) {
        let circle = cos_sin(base_circles[0] - i / (steps * larger / smaller) , diff);
        path_points[i] = cos_sin(base_points[0] - (larger - smaller) / smaller * i / (steps * larger / smaller), circle_radius * distance, circle, true, true);
      }
    }
    calculate();
  })();

  // Rendering
  (function() {
    let drawAlpha = 1;
    function draw_outer_circle(style = styles['outercircle'], ctx = static_ctx) {
      if (style.visible && style.thickness > 0 && style.alpha > 0) {
        ctx.lineWidth = scale * style.thickness;
        ctx.strokeStyle = style.color;
        ctx.globalAlpha = drawAlpha * style.alpha;
        ctx.beginPath();
        let radius = main_radius + scale * (style.thickness/2 + styles['innercircles'].thickness / 2);
        ctx.arc(...canvas_center, radius, 0, 2*Math.PI);
        ctx.stroke();
      }
    }

    function draw_star(style = styles['star'], ctx = static_ctx) {
      if (style.visible && style.thickness > 0 && style.alpha > 0) {
        ctx.lineWidth = scale * style.thickness;
        ctx.strokeStyle = style.color;
        ctx.globalAlpha = drawAlpha * style.alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        star_vertices.forEach((v, i) => {
          ctx.moveTo(...v);
          ctx.lineTo(...star_vertices[star_edges[i]]);
        });
        ctx.stroke();
      }
    }

    function draw_path(style = styles['path'], ctx = static_ctx) {
      if (style.visible && style.thickness > 0 && style.alpha > 0) {
        ctx.lineWidth = scale * style.thickness;
        ctx.strokeStyle = style.color;
        ctx.globalAlpha = drawAlpha * style.alpha;
        ctx.lineCap = 'round';
        ctx.translate(...canvas_center)
        ctx.beginPath();
        for (var i = 0; i < larger; i++) {
          ctx.moveTo(...path_points[0]);
          for(var j = 1; j < path_points.length; j++){
            ctx.lineTo(...path_points[j]);
            ctx.moveTo(...path_points[j]);
          }
          ctx.rotate(2 * Math.PI / larger);
        }
        ctx.stroke();
        ctx.resetTransform();
      }
    }

    function draw_circles(style = styles['innercircles'], ctx = animation_ctx) {
      if (style.visible) {
        let thickness = scale * style.thickness;
        if (style.fill) {
          ctx.lineWidth = (circle_radius - thickness/2) - (center ? (center_size/2) : 0);
          ctx.strokeStyle = style.fill.color;
          ctx.globalAlpha = drawAlpha * style.fill.alpha;
          let fill_radius = (circle_radius - thickness/2)/2 + (center ? (center_size/2)/2 : 0);
          ctx.beginPath();
          circles.forEach((c, i) => {
            ctx.moveTo(c[0] + fill_radius, c[1]);
            ctx.arc(...c, fill_radius, 0, 2*Math.PI);
          });
          ctx.stroke();
        }
        if (isObject(style.center) && style.center.visible == true && style.center.thickness > 0 && style.center.alpha > 0) {
          let thickness = style.center.thickness/2;
          ctx.lineWidth = thickness;
          ctx.strokeStyle = style.center.color;
          ctx.globalAlpha = drawAlpha * style.center.alpha;
          ctx.beginPath();
          circles.forEach((c, i) => {
            ctx.moveTo(c[0] + thickness/4, c[1]);
            ctx.arc(...c, thickness/4, 0, 2*Math.PI);
          });
          ctx.stroke();
        }
        if (style.thickness > 0 && style.alpha > 0)
        {
          ctx.lineWidth = thickness;
          ctx.strokeStyle = style.color;
          ctx.globalAlpha = drawAlpha * style.alpha;
          ctx.beginPath();
          circles.forEach((c, i) => {
            ctx.moveTo(c[0] + circle_radius, c[1]);
            ctx.arc(...c, circle_radius, 0, 2*Math.PI);
          });
          ctx.stroke();
        }
      }
    }

    function draw_large_polygons(style = styles['largepolygons'], ctx = animation_ctx) {
      if (style.visible && style.thickness > 0 && style.alpha > 0) {
        ctx.lineWidth = scale * style.thickness;
        ctx.strokeStyle = style.color;
        ctx.globalAlpha = drawAlpha * style.alpha;
        ctx.lineCap = 'round';
        let c = points.length;
        if (c < 1) return;
        let p = points[0].length;
        ctx.beginPath();
        for (var j = 0; j < p; j++){
          ctx.moveTo(...points[0][j]);
          for(var i = 1; i < c; i++){
            ctx.lineTo(...points[i][j]);
            ctx.moveTo(...points[i][j]);
          }
          ctx.lineTo(...points[0][j]);
          if (style.overlap && j < p - 1){
            ctx.stroke();
            ctx.beginPath();
          }
        }
        ctx.stroke();
      }
    }

    function draw_small_polygons(style = styles['smallpolygons'], ctx = animation_ctx) {
      if (style.visible && style.thickness > 0 && style.alpha > 0) {
        ctx.lineWidth = scale * style.thickness;
        ctx.strokeStyle = style.color;
        ctx.globalAlpha = drawAlpha * style.alpha;
        ctx.lineCap = 'round';
        let c = points.length;
        if (c < 1) return;
        let p = points[0].length;
        if (p < 1) return;
        ctx.beginPath();
        for (var i = 0; i < c; i++){
          ctx.moveTo(...points[i][0]);
          for(var j = 0; j < p; j++) {
            ctx.lineTo(...points[i][j]);
            ctx.moveTo(...points[i][j]);
          }
          ctx.lineTo(...points[i][0]);
          if (style.overlap && i < c - 1){
            ctx.stroke();
            ctx.beginPath();
          }
        }
        ctx.stroke();
      }
    }

    function draw_points(style = styles['dots'], ctx = animation_ctx) {
      if (style.visible && style.thickness > 0 && style.alpha > 0) {
        let size = scale * style.thickness;
        ctx.lineWidth = size / 2;
        ctx.strokeStyle = style.color;
        ctx.globalAlpha = drawAlpha * style.alpha;
        ctx.beginPath();
        points.forEach((c, i) => {
          points[i].forEach((p, j) => {
            ctx.moveTo(...p);
            ctx.arc(...p, size / 4, 0, 2*Math.PI);
          });
        });
        ctx.stroke();
      }
    }

    function draw_static_background(style = styles) {
      if (true) {
        static_ctx.clearRect(0, 0, canvas_size, canvas_size);
        draw_outer_circle(style.outercircle);
        draw_star(style.star);
        draw_path(style.path);
        static_update = false;
      }
      main_ctx.drawImage(static_canvas, 0, 0);
    }

    function draw_foreground(style = styles) {
      animation_ctx.clearRect(0, 0, canvas_size, canvas_size);
      draw_circles(style.innercircles);
      draw_large_polygons(style.largepolygons);
      draw_small_polygons(style.smallpolygons);
      draw_points(style.dots);
      main_ctx.drawImage(animation_canvas, 0, 0);
    }

    function draw_view(style, clear = true) {
      if (clear) main_ctx.clearRect(0, 0, canvas_size, canvas_size);
      draw_static_background(style);
      draw_foreground(style);
    }

    let prev_time = Date.now();
    let cur_time = prev_time;
    let keyframe_start_time = prev_time;
    let currentKeyframe = 0;
    let nextKeyframe = 0;
    function render() {
      cur_time = Date.now();
      let keyframe_time = (cur_time - keyframe_start_time)/1000;
      let transition = 0;
      let animation = animation_preview == 'animation' && keyframes.length > 0;
      if (animation && keyframes.length > 1 && keyframe_time >= keyframes[currentKeyframe].duration) {
        currentKeyframe = nextKeyframe;
        nextKeyframe = (currentKeyframe + 1) % keyframes.length;
        keyframe_start_time = cur_time;
        keyframe_time = 0;
        static_update = true;
      }
      if (animation && keyframes[currentKeyframe].transition > 0 && keyframes[currentKeyframe].duration - keyframe_time < keyframes[currentKeyframe].transition) {
        transition = 1 - (keyframes[currentKeyframe].duration - keyframe_time) / keyframes[currentKeyframe].transition;
      }
      percent = (percent + (cur_time - prev_time)/1000 * animation_speed) % (smaller);
      prev_time = cur_time;
      if (static_update) {
        calculate_static();
      }
      calculate(percent);
      drawAlpha = 1;
      draw_view(animation ? getTransitionStyle(keyframes[currentKeyframe].styles, keyframes[nextKeyframe].styles, transition) : styles);

      main_ctx.restore();
      window.requestAnimationFrame(render)
    }

    window.requestAnimationFrame(render);
  })();



});
}) ();
