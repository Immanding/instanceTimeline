// 观测者
class Observer {
  dep: Dep;
  value: any;
  constructor(val) {
    this.value = val;
    this.dep = new Dep();
    this.walk(val);
    this.value.__ob__ = this;
  }

  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }
}

// 销毁时用
let did = 0;
// 连接Observer和watcher
class Dep {
  subs: any[];
  id: number;
  static target: any;
  static pushTarget: (w: Watcher) => void;
  static targetStack: any[];
  static popTarget: () => void;
  constructor () {
    this.id = did++;
    this.subs = [];
  }
  addSub(watch:Watcher) {
    this.subs.push(watch)
  }
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  notify() {
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}
Dep.target = null;
Dep.targetStack = []
Dep.pushTarget = function(w:Watcher) {
  Dep.target = w;
  Dep.targetStack.push(w);
}
Dep.popTarget = function() {
  Dep.targetStack.pop();
  Dep.target = Dep.targetStack[Dep.targetStack.length-1]
}

// 订阅者
class Watcher {
  getter: any;
  // getter实际上应该是$data有关的方法
  constructor(getter) {
    this.getter = getter;
    this.get();
  }
  get() {
    Dep.pushTarget(this);
    this.getter.call();
    Dep.popTarget();
  }
  addDep(dep:Dep) {
    dep.addSub(this)
  }
  update() {
    this.run()
  }
  run() {
    this.get();
  }
}


function observe(obj:any=undefined) {
  let ob;
  if (obj.__ob__) {
    ob = obj.__ob__
  } else if (Array.isArray(obj) || Object.prototype.toString.call(obj) === '[object Object]'){
    ob = new Observer(obj)
  }
  return ob;
}

// 定义响应式属性，由源码可见，其实在$mount之前，其实不算完成响应式
function defineReactive(obj:Object = {},key:string,val:any = obj[key]) {
  let dep = new Dep()
  let childOb = observe(val)
  Object.defineProperty(obj,key,{
    get:function() {
      const value = val;
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
        }
      }
      return value
    },
    set:function(newVal) {
      val = newVal;
      childOb = observe(newVal)
      dep.notify()
    }
  })
}


// test
let vm = {
  $data:{
    a:{
    }
  }
}

// 设置响应式属性
defineReactive(vm,'$data');

new Watcher(function() {console.log(`because I need to update or mount Vue Components,I need vm.$data.a:${vm.$data.a} to do my job`)})

vm.$data.a="hi"
//because I need to update or mount Vue Components,I need vm.$data.a:hi to do my job