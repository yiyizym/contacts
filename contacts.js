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
      generateListItem: null,
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
      ctn.querySelector('.wx-contacts-all-result').appendChild(list);

      var appendTo = this.opts.appendTo || 'body';
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
        firstCharUpper = self.getFirstUpperChar(item.name);
        if (map.hasOwnProperty(firstCharUpper)) {
          map[firstCharUpper].push(item);
        } else {
          map['#'].push(item);
        }
      });

      //排序
      for(var key in map) {
        if( map.hasOwnProperty( key ) && (map[key].length != 0)) {
          map[key].sort(function(a, b){
            return a.name.localeCompare(b.name, 'zh-CN-u-co-pinyin');
          });
        }
      }

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
      ctn.classList.add('wx-contacts-shortcuts-ctn');
      var test,a;
      items.forEach(function(item){
        text = document.createTextNode(item);
        a = document.createElement('a');
        a.setAttribute('href', '#wx-contacts-hook-' + item);
        a.setAttribute('rel', 'internal');
        a.appendChild(text);
        ctn.appendChild(a);
      });
      a = document.createElement('a');
      a.setAttribute('href', '#wx-contacts-hook-search');
      a.setAttribute('rel', 'internal');
      ctn.insertBefore(a, ctn.firstChild);
      document.body.appendChild(ctn);
    },
    generateList: function(){
      var self = this;
      var map = self.dictMap;
      var formerKey = null;
      var list = document.createElement('ul');
      list.classList.add('wx-contacts-list');
      for(var key in map) {
        if( map.hasOwnProperty( key ) && (map[key].length != 0)) {
          var items = map[key];
          items.forEach(function(item){
            var text,li,a;
            if(key != formerKey){
              a = document.createElement('a');
              a.setAttribute('id', 'wx-contacts-hook-' + key);
              text = document.createTextNode(key);
              li = document.createElement('li');
              li.classList.add('wx-contacts-hooks');
              li.appendChild(a);
              li.appendChild(text);
              list.appendChild(li);
              formerKey = key;
            }
            list.appendChild(self.generateListItem(item));
          });
        }
      }
      return list;
    },
    generateListItem: function(item){
      if(this.opts.generateListItem && typeof this.opts.generateListItem == 'function'){
        return this.opts.generateListItem(item);
      }
      var tpl = '<img class="wx-contacts-badge" src="' + item.badge +'"></img><span>'+ item.name + '</span>';
      var li = document.createElement('li');
      li.innerHTML = tpl;
      return li;
    },
    generateCtn: function(){
      var ctn = document.createElement('div');
      ctn.classList.add('wx-contacts-container');
      ctn.appendChild(this.generateInputCtn());
      var searchResult = document.createElement('div');
      searchResult.classList.add('wx-contacts-search-result');
      ctn.appendChild(searchResult);
      var allResult = document.createElement('div');
      allResult.classList.add('wx-contacts-all-result');
      ctn.appendChild(allResult);
      return ctn;
    },
    generateInputCtn: function(){
      var div = document.createElement('div');
      div.classList.add('wx-contacts-search-bar');
      div.setAttribute('id','wx-contacts-hook-search');
      var innerHtml = 
        '<div class="wx-contacts-search-inner">' +
          '<i class="wx-contacts-icon-search"></i>' +
          '<input type="search" class="wx-contacts-search-input" id="wx-contacts-search-input" placeholder="搜索" required/>' +
          '<a href="javascript:" class="wx-contacts-icon-clear hidden" id="search-clear"></a>' +
        '</div>' +
        '<label for="wx-contacts-search-input" class="wx-contacts-search-text">' +
          '<i class="wx-contacts-icon-search"></i>' +
          '<span>搜索</span>' +
        '</label>';

        div.innerHTML = innerHtml;

        return div;
    },
    generateFilteredList: function(map, filter_str){
      var list = document.createElement('ul');
      list.classList.add('wx-contacts-list');
      var li;
      for( var key in map){
        if( map.hasOwnProperty( key ) && (map[key].length != 0)) {
          var items = map[key];
          items.forEach(function(item){
            if (String(item.name).match(filter_str)) {
              li = document.createElement('li')
              li.appendChild(document.createTextNode(item.name));
              list.appendChild(li);
            }
          });
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
    // adopt from https://ruby-china.org/topics/29026
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
      var anchors = document.querySelectorAll('.wx-contacts-hooks');
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
              item.anchor.classList.remove('wx-contacts-on-top');
            });
            topBarElement = self.getTopbarElement(lastKnownScrollPosition);
            topBarElement && topBarElement.classList.add('wx-contacts-on-top');
            ticking = false;
          });
        }
        ticking = true;
      });
      document.querySelector('#wx-contacts-search-input').addEventListener('change', function(e){
        var searchStr = e.target.value.trim();
        var list;
        if (searchStr.length != 0) {
          //hide list
          document.querySelector('.wx-contacts-all-result').classList.add('hidden');
          //hide shortcuts
          document.querySelector('.wx-contacts-shortcuts-ctn').classList.add('hidden');
          //filter list
          list = self.generateFilteredList(self.dictMap, searchStr);
          //set result list
          var searchResult = document.querySelector('.wx-contacts-search-result');
          while(searchResult.lastChild){
            searchResult.removeChild(searchResult.lastChild);
          }
          searchResult.appendChild(list);
          //show result list
          document.querySelector('.wx-contacts-search-result').classList.remove('hidden');
        }
        else {
          document.querySelector('.wx-contacts-all-result').classList.remove('hidden');
          document.querySelector('.wx-contacts-shortcuts-ctn').classList.remove('hidden');
          document.querySelector('.wx-contacts-search-result').classList.add('hidden');
        }
      });

      document.querySelector('#wx-contacts-search-input').addEventListener('keyup', function(e){
        var searchStr = e.target.value.trim();
        if(searchStr.length != 0){
          document.querySelector('#search-clear').classList.remove('hidden');
        }
        else {
          document.querySelector('#search-clear').classList.add('hidden');
        }
      });

      document.querySelector('#wx-contacts-search-input').addEventListener('focus', function(){
        document.querySelector('.wx-contacts-search-bar').classList.add('wx-contacts-search-focusing');
        if(this.value){
          document.querySelector('#search-clear').classList.remove('hidden');
        }
        else {
          document.querySelector('#search-clear').classList.add('hidden');
        }
      });

      document.querySelector('#wx-contacts-search-input').addEventListener('blur', function(e){
        document.querySelector('.wx-contacts-search-bar').classList.remove('wx-contacts-search-focusing');
        if (this.value) {
          document.querySelector('.wx-contacts-search-text').classList.add('hidden');
        } else {
          document.querySelector('.wx-contacts-search-text').classList.remove('hidden');
        }
      });

      document.querySelector('#search-clear').addEventListener('touchend', function(){
        document.querySelector('#wx-contacts-search-input').value = '';
      });

    }
  };

  global.Contacts = Contacts;
})(window);

