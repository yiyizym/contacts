(function(global, undefined){
  function Contacts(opts){
    if(!(this instanceof Contacts)){
      return new Contacts(opts);
    }
    this.merge(this.opts, opts);
    this.init();
  }

  Contacts.prototype = {
    opts: {
      appendTo: '',
      clz: 'wx_contacts',
      data: []
    },
    merge: function(defaultOpts, userOpts){
      if(userOpts){
        Object.assign(defaultOpts, userOpts);
      }
    },
    init: function(){
      this.parseData();
      this.generateShortcuts();

      var list = this.generateList();
      var ctn = this.generateCtn();
      ctn.querySelector('.all-result').appendChild(list);

      var appendTo = this.opts.appendTo || 'body'
      document.querySelector(appendTo).appendChild(ctn);

      this.getAllAnchorPositions();
      this.addListener();
    },
    parseData: function(){
      var self = this;
      var data = this.opts.data;
      var map = {};
      var c = 'A'.charCodeAt();
      for(; c <= 'Z'.charCodeAt(); c++ ){
        map[String.fromCharCode(c)] = [];
      }
      map['#'] = [];
      var firstCharUpper;
      data.forEach(function(item){
        firstCharUpper = self.getFirstUpperChar(item);
        if (map.hasOwnProperty(firstCharUpper)) {
          map[firstCharUpper].push(item);
        } else {
          map['#'].push(item);
        }
      });
      this.dictMap = map;
      return map;
    },
    generateShortcuts: function(){
      var items = [];
      var map = this.dictMap;
      for(var key in map) {
        if( map.hasOwnProperty( key ) && (map[key].length != 0)) {
          items.push(key);
        }
      }
      var ctn = document.createElement('div');
      ctn.classList.add('shortcuts-ctn');
      var test,a;
      items.forEach(function(item){
        text = document.createTextNode(item);
        a = document.createElement('a');
        a.setAttribute('href', '#hook-' + item);
        a.setAttribute('rel', 'internal');
        a.appendChild(text);
        ctn.appendChild(a);
      });
      a = document.createElement('a');
      a.setAttribute('href', '#hook-search');
      a.setAttribute('rel', 'internal');
      ctn.insertBefore(a, ctn.firstChild);
      document.body.appendChild(ctn);
    },
    generateList: function(){
      var map = this.dictMap;
      var formerKey = null;
      var list = document.createElement('ul');
      list.classList.add('list');
      for(var key in map) {
        if( map.hasOwnProperty( key ) && (map[key].length != 0)) {
          var items = map[key];
          items.forEach(function(item){
            var text,li;
            if(key != formerKey){
              text = document.createTextNode(key);
              li = document.createElement('li');
              li.classList.add('hooks');
              li.setAttribute('id', 'hook-' + key);
              li.appendChild(text);
              list.appendChild(li);
              formerKey = key;
            }
            text = document.createTextNode(item);
            li = document.createElement('li');
            li.appendChild(text);
            list.appendChild(li);
          });
        }
      }
      return list;
    },
    generateCtn: function(){
      var ctn = document.createElement('div');
      ctn.classList.add('container');
      var input = document.createElement('input');
      input.classList.add('search');
      input.setAttribute('id','hook-search');
      input.setAttribute('placeholder', '搜索');
      ctn.appendChild(input);
      var searchResult = document.createElement('div');
      searchResult.classList.add('search-result');
      ctn.appendChild(searchResult);
      var allResult = document.createElement('div');
      allResult.classList.add('all-result');
      ctn.appendChild(allResult);
      return ctn;
    },
    generateFilteredList: function(map, filter_str){
      var list = document.createElement('ul');
      list.classList.add('list');
      var li;
      for( var key in map){
        if( map.hasOwnProperty( key ) && (map[key].length != 0)) {
          var items = map[key];
          items.forEach(function(item){
            if (String(item).match(filter_str)) {
              li = document.createElement('li')
              li.appendChild(document.createTextNode(item));
              list.appendChild(li);
            }
          })
        }
      }
      return list;
    },
    getFirstUpperChar: function(str){
      string = String(str);
      var c = string[0];
      if (/[^\u4e00-\u9fa5]/.test(c)) {
        return c.toUpperCase();
      }
      else {
        return this.chineseToEnglish(c);
      }
    },
    // copy from https://ruby-china.org/topics/29026
    chineseToEnglish: function(c){
      var idx = -1;
      var MAP = 'ABCDEFGHJKLMNOPQRSTWXYZ';
      var boundaryChar = '驁簿錯鵽樲鰒餜靃攟鬠纙鞪黁漚曝裠鶸蜶籜鶩鑂韻糳';
      if (!String.prototype.localeCompare) {
        throw Error('String.prototype.localeCompare not supported.');
      }
      if (/[^\u4e00-\u9fa5]/.test(c)) {
        return c;
      }
      for (var i = 0; i < boundaryChar.length; i++) {
        if (boundaryChar[i].localeCompare(c, 'zh-CN-u-co-pinyin') >= 0) {
          idx = i;
          break;
        }
      }
      return MAP[idx];
    },
    getAllAnchorPositions: function(){
      var anchors = document.querySelectorAll('.hooks');
      var self = this;
      self.positions = [];
      anchors = [].slice.call(anchors);

      anchors.forEach(function(anchor){
        self.positions.push({
          anchor: anchor,
          pos: anchor.getBoundingClientRect().top
        });
      });
    },
    getTopbarElement: function(scrollPosition){
      var i = 0;
      var gutter = 20;
      while((i < this.positions.length) && scrollPosition + gutter >= this.positions[i].pos){
        i ++;
      }


      if (i == 0) {
        return null;
      }
      else {
        return this.positions[i-1].anchor;
      }
    },
    addListener: function(){
      // scroll optimization
      // see https://developer.mozilla.org/en-US/docs/Web/Events/scroll
      var lastKnownScrollPosition = 0;
      var ticking = false;
      var topBarElement = null;
      var self = this;
      window.addEventListener('scroll', function(e){
        lastKnownScrollPosition = window.scrollY;
        if(!ticking) {
          window.requestAnimationFrame(function(){
            //do some thing here
            
            self.positions.forEach(function(item){
              item.anchor.classList.remove('on-top');
            });
            topBarElement = self.getTopbarElement(lastKnownScrollPosition);
            topBarElement && topBarElement.classList.add('on-top');
            ticking = false;
          });
        }
        ticking = true;
      });
      document.querySelector('input.search').addEventListener('keyup', function(e){
        var searchStr = e.target.value.trim();
        var list;
        if (searchStr.length != 0) {
          //hide list
          document.querySelector('.all-result').classList.add('hidden');
          //hide shortcuts
          document.querySelector('.shortcuts-ctn').classList.add('hidden');
          //filter list
          list = self.generateFilteredList(self.dictMap, searchStr);
          //set result list
          var searchResult = document.querySelector('.search-result');
          while(searchResult.lastChild){
            searchResult.removeChild(searchResult.lastChild);
          }
          searchResult.appendChild(list);
          //show result list
          document.querySelector('.search-result').classList.remove('hidden');
        }
        else {
          document.querySelector('.all-result').classList.remove('hidden');
          document.querySelector('.shortcuts-ctn').classList.remove('hidden');
          document.querySelector('.search-result').classList.add('hidden');
        }
      });
    }
  }

  global.Contacts = Contacts;
})(window);

