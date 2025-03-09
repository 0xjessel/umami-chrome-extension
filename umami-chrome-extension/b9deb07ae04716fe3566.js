/*! For license information please see b9deb07ae04716fe3566.js.LICENSE.txt */
function e(t){return e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},e(t)}function t(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=Array(t);r<t;r++)n[r]=e[r];return n}function r(){r=function(){return n};var t,n={},o=Object.prototype,a=o.hasOwnProperty,i=Object.defineProperty||function(e,t,r){e[t]=r.value},s="function"==typeof Symbol?Symbol:{},c=s.iterator||"@@iterator",u=s.asyncIterator||"@@asyncIterator",l=s.toStringTag||"@@toStringTag";function d(e,t,r){return Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}),e[t]}try{d({},"")}catch(t){d=function(e,t,r){return e[t]=r}}function f(e,t,r,n){var o=t&&t.prototype instanceof w?t:w,a=Object.create(o.prototype),s=new A(n||[]);return i(a,"_invoke",{value:S(e,r,s)}),a}function p(e,t,r){try{return{type:"normal",arg:e.call(t,r)}}catch(e){return{type:"throw",arg:e}}}n.wrap=f;var h="suspendedStart",y="suspendedYield",m="executing",v="completed",g={};function w(){}function b(){}function x(){}var E={};d(E,c,(function(){return this}));var L=Object.getPrototypeOf,k=L&&L(L(O([])));k&&k!==o&&a.call(k,c)&&(E=k);var U=x.prototype=w.prototype=Object.create(E);function I(e){["next","throw","return"].forEach((function(t){d(e,t,(function(e){return this._invoke(t,e)}))}))}function F(t,r){function n(o,i,s,c){var u=p(t[o],t,i);if("throw"!==u.type){var l=u.arg,d=l.value;return d&&"object"==e(d)&&a.call(d,"__await")?r.resolve(d.__await).then((function(e){n("next",e,s,c)}),(function(e){n("throw",e,s,c)})):r.resolve(d).then((function(e){l.value=e,s(l)}),(function(e){return n("throw",e,s,c)}))}c(u.arg)}var o;i(this,"_invoke",{value:function(e,t){function a(){return new r((function(r,o){n(e,t,r,o)}))}return o=o?o.then(a,a):a()}})}function S(e,r,n){var o=h;return function(a,i){if(o===m)throw Error("Generator is already running");if(o===v){if("throw"===a)throw i;return{value:t,done:!0}}for(n.method=a,n.arg=i;;){var s=n.delegate;if(s){var c=B(s,n);if(c){if(c===g)continue;return c}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(o===h)throw o=v,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);o=m;var u=p(e,r,n);if("normal"===u.type){if(o=n.done?v:y,u.arg===g)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(o=v,n.method="throw",n.arg=u.arg)}}}function B(e,r){var n=r.method,o=e.iterator[n];if(o===t)return r.delegate=null,"throw"===n&&e.iterator.return&&(r.method="return",r.arg=t,B(e,r),"throw"===r.method)||"return"!==n&&(r.method="throw",r.arg=new TypeError("The iterator does not provide a '"+n+"' method")),g;var a=p(o,e.iterator,r.arg);if("throw"===a.type)return r.method="throw",r.arg=a.arg,r.delegate=null,g;var i=a.arg;return i?i.done?(r[e.resultName]=i.value,r.next=e.nextLoc,"return"!==r.method&&(r.method="next",r.arg=t),r.delegate=null,g):i:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,g)}function P(e){var t={tryLoc:e[0]};1 in e&&(t.catchLoc=e[1]),2 in e&&(t.finallyLoc=e[2],t.afterLoc=e[3]),this.tryEntries.push(t)}function T(e){var t=e.completion||{};t.type="normal",delete t.arg,e.completion=t}function A(e){this.tryEntries=[{tryLoc:"root"}],e.forEach(P,this),this.reset(!0)}function O(r){if(r||""===r){var n=r[c];if(n)return n.call(r);if("function"==typeof r.next)return r;if(!isNaN(r.length)){var o=-1,i=function e(){for(;++o<r.length;)if(a.call(r,o))return e.value=r[o],e.done=!1,e;return e.value=t,e.done=!0,e};return i.next=i}}throw new TypeError(e(r)+" is not iterable")}return b.prototype=x,i(U,"constructor",{value:x,configurable:!0}),i(x,"constructor",{value:b,configurable:!0}),b.displayName=d(x,l,"GeneratorFunction"),n.isGeneratorFunction=function(e){var t="function"==typeof e&&e.constructor;return!!t&&(t===b||"GeneratorFunction"===(t.displayName||t.name))},n.mark=function(e){return Object.setPrototypeOf?Object.setPrototypeOf(e,x):(e.__proto__=x,d(e,l,"GeneratorFunction")),e.prototype=Object.create(U),e},n.awrap=function(e){return{__await:e}},I(F.prototype),d(F.prototype,u,(function(){return this})),n.AsyncIterator=F,n.async=function(e,t,r,o,a){void 0===a&&(a=Promise);var i=new F(f(e,t,r,o),a);return n.isGeneratorFunction(t)?i:i.next().then((function(e){return e.done?e.value:i.next()}))},I(U),d(U,l,"Generator"),d(U,c,(function(){return this})),d(U,"toString",(function(){return"[object Generator]"})),n.keys=function(e){var t=Object(e),r=[];for(var n in t)r.push(n);return r.reverse(),function e(){for(;r.length;){var n=r.pop();if(n in t)return e.value=n,e.done=!1,e}return e.done=!0,e}},n.values=O,A.prototype={constructor:A,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(T),!e)for(var r in this)"t"===r.charAt(0)&&a.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t)},stop:function(){this.done=!0;var e=this.tryEntries[0].completion;if("throw"===e.type)throw e.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var r=this;function n(n,o){return s.type="throw",s.arg=e,r.next=n,o&&(r.method="next",r.arg=t),!!o}for(var o=this.tryEntries.length-1;o>=0;--o){var i=this.tryEntries[o],s=i.completion;if("root"===i.tryLoc)return n("end");if(i.tryLoc<=this.prev){var c=a.call(i,"catchLoc"),u=a.call(i,"finallyLoc");if(c&&u){if(this.prev<i.catchLoc)return n(i.catchLoc,!0);if(this.prev<i.finallyLoc)return n(i.finallyLoc)}else if(c){if(this.prev<i.catchLoc)return n(i.catchLoc,!0)}else{if(!u)throw Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return n(i.finallyLoc)}}}},abrupt:function(e,t){for(var r=this.tryEntries.length-1;r>=0;--r){var n=this.tryEntries[r];if(n.tryLoc<=this.prev&&a.call(n,"finallyLoc")&&this.prev<n.finallyLoc){var o=n;break}}o&&("break"===e||"continue"===e)&&o.tryLoc<=t&&t<=o.finallyLoc&&(o=null);var i=o?o.completion:{};return i.type=e,i.arg=t,o?(this.method="next",this.next=o.finallyLoc,g):this.complete(i)},complete:function(e,t){if("throw"===e.type)throw e.arg;return"break"===e.type||"continue"===e.type?this.next=e.arg:"return"===e.type?(this.rval=this.arg=e.arg,this.method="return",this.next="end"):"normal"===e.type&&t&&(this.next=t),g},finish:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var r=this.tryEntries[t];if(r.finallyLoc===e)return this.complete(r.completion,r.afterLoc),T(r),g}},catch:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var r=this.tryEntries[t];if(r.tryLoc===e){var n=r.completion;if("throw"===n.type){var o=n.arg;T(r)}return o}}throw Error("illegal catch attempt")},delegateYield:function(e,r,n){return this.delegate={iterator:O(e),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=t),g}},n}function n(e,t,r,n,o,a,i){try{var s=e[a](i),c=s.value}catch(e){return void r(e)}s.done?t(c):Promise.resolve(c).then(n,o)}function o(e){return function(){var t=this,r=arguments;return new Promise((function(o,a){var i=e.apply(t,r);function s(e){n(i,o,a,s,c,"next",e)}function c(e){n(i,o,a,s,c,"throw",e)}s(void 0)}))}}import"./options.css";import{StorageManager as a}from"../src/storage.js";import{POLLING_INTERVALS as i,DEFAULT_POLLING_INTERVAL as s}from"../src/constants.js";import{UmamiAPI as c}from"../src/api.js";var u,l={credentialsForm:document.getElementById("credentialsForm"),displayForm:document.getElementById("displayForm"),verifyButton:document.getElementById("verifyButton"),resetButton:document.getElementById("resetButton"),status:document.getElementById("status"),selfHostedAuth:document.getElementById("selfHostedAuth"),baseUrl:document.getElementById("baseUrl"),urlHelp:document.getElementById("urlHelp"),urlValidation:document.getElementById("urlValidation"),password:document.getElementById("password"),togglePassword:document.getElementById("togglePassword")};function d(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"";l.status.textContent=e,l.status.className="status ".concat(t),setTimeout((function(){l.status.classList.add("hidden")}),3e3)}function f(){return p.apply(this,arguments)}function p(){return(p=o(r().mark((function e(){var n,o,s,c;return r().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,a.getConfig();case 2:n=e.sent,l.baseUrl.value=n.baseUrl||"",l.credentialsForm.querySelector("#websiteId").value=n.websiteId||"",l.credentialsForm.querySelector("#username").value=n.username||"",l.credentialsForm.querySelector("#password").value=n.password||"",l.displayForm.querySelectorAll('input[name="badgeMetric"]').forEach((function(e){e.checked=e.value===n.badgeMetric})),l.displayForm.querySelector('input[name="showActiveUsers"]').checked=n.showActiveUsers,l.displayForm.querySelector('input[name="showPageViews"]').checked=n.showPageViews,l.displayForm.querySelector('input[name="showVisitors"]').checked=n.showVisitors,l.displayForm.querySelector('input[name="showVisits"]').checked=n.showVisits,l.displayForm.querySelector('input[name="showBounces"]').checked=n.showBounces,l.displayForm.querySelector('input[name="showTotalTime"]').checked=n.showTotalTime,o=l.displayForm.querySelector("#pollingInterval"),s="ONE_MINUTE",n.pollingInterval&&(c=Object.entries(i),s=c.reduce((function(e,r){var o,a,s=(a=2,function(e){if(Array.isArray(e))return e}(o=r)||function(e,t){var r=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=r){var n,o,a,i,s=[],c=!0,u=!1;try{if(a=(r=r.call(e)).next,0===t){if(Object(r)!==r)return;c=!1}else for(;!(c=(n=a.call(r)).done)&&(s.push(n.value),s.length!==t);c=!0);}catch(e){u=!0,o=e}finally{try{if(!c&&null!=r.return&&(i=r.return(),Object(i)!==i))return}finally{if(u)throw o}}return s}}(o,a)||function(e,r){if(e){if("string"==typeof e)return t(e,r);var n={}.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?t(e,r):void 0}}(o,a)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()),c=s[0],u=s[1];return Math.abs(u-n.pollingInterval)<Math.abs(i[e]-n.pollingInterval)?c:e}),"ONE_MINUTE")),o.value=s;case 19:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function h(e,t,r){return y.apply(this,arguments)}function y(){return(y=o(r().mark((function e(t,n,o){var a,i;return r().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,fetch("".concat(t,"/api/auth/login"),{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({username:n,password:o})});case 2:if((a=e.sent).ok){e.next=5;break}throw new Error("Authentication failed");case 5:return e.next=7,a.json();case 7:return i=e.sent,e.abrupt("return",i.token);case 9:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function m(e){return v.apply(this,arguments)}function v(){return(v=o(r().mark((function e(t){var n,o,i,s,c,u,f;return r().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(t.preventDefault(),n=new FormData(t.target),o=n.get("baseUrl"),i=n.get("websiteId"),s=n.get("username"),c=n.get("password"),k(l.baseUrl)){e.next=9;break}return d("Please enter a valid URL","error"),e.abrupt("return");case 9:return e.prev=9,e.next=12,h(o,s,c);case 12:return u=e.sent,f={serverType:"self-hosted",baseUrl:o,token:u,websiteId:i,username:s,password:c},e.next=16,a.setCredentials(f);case 16:d("Credentials saved successfully","success"),e.next=22;break;case 19:e.prev=19,e.t0=e.catch(9),d("Failed to save credentials: "+e.t0.message,"error");case 22:case"end":return e.stop()}}),e,null,[[9,19]])})))).apply(this,arguments)}function g(e){return w.apply(this,arguments)}function w(){return(w=o(r().mark((function e(t){var n,o;return r().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t.preventDefault(),n=new FormData(t.target),o={badgeMetric:n.get("badgeMetric"),showActiveUsers:"on"===n.get("showActiveUsers"),showPageViews:"on"===n.get("showPageViews"),showVisitors:"on"===n.get("showVisitors"),showVisits:"on"===n.get("showVisits"),showBounces:"on"===n.get("showBounces"),showTotalTime:"on"===n.get("showTotalTime"),pollingInterval:i[n.get("pollingInterval")]},e.prev=3,e.next=6,a.updatePreferences(o);case 6:d("Settings saved successfully","success"),e.next=12;break;case 9:e.prev=9,e.t0=e.catch(3),d("Failed to save settings: "+e.t0.message,"error");case 12:case"end":return e.stop()}}),e,null,[[3,9]])})))).apply(this,arguments)}function b(){return x.apply(this,arguments)}function x(){return(x=o(r().mark((function e(){return r().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(confirm("Are you sure you want to reset all settings to default?")){e.next=2;break}return e.abrupt("return");case 2:return e.prev=2,e.next=5,a.updateConfig(a.DEFAULT_CONFIG);case 5:return e.next=7,a.clearCredentials();case 7:return e.next=9,f();case 9:d("Settings reset to default","success"),e.next=15;break;case 12:e.prev=12,e.t0=e.catch(2),d("Failed to reset settings: "+e.t0.message,"error");case 15:case"end":return e.stop()}}),e,null,[[2,12]])})))).apply(this,arguments)}function E(){return L.apply(this,arguments)}function L(){return(L=o(r().mark((function e(){var t,n,o,a,i,s,u;return r().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(k(l.baseUrl)){e.next=3;break}return d("Please enter a valid URL","error"),e.abrupt("return");case 3:if(t=new FormData(l.credentialsForm),n=t.get("baseUrl"),o=t.get("websiteId"),a=t.get("username"),i=t.get("password"),(s=new c).serverType="self-hosted",s.baseUrl=n,o){e.next=14;break}return d("Website ID is required","error"),e.abrupt("return");case 14:return s.websiteId=o,e.prev=15,e.next=18,h(n,a,i);case 18:return u=e.sent,s.token=u,e.next=22,s.getActiveUsers();case 22:d("Connection verified successfully","success"),e.next=28;break;case 25:e.prev=25,e.t0=e.catch(15),d("Connection failed: "+e.t0.message,"error");case 28:case"end":return e.stop()}}),e,null,[[15,25]])})))).apply(this,arguments)}function k(e){if(l.urlValidation.textContent="",!e.value)return e.setCustomValidity("Please enter your Umami server URL"),l.urlValidation.textContent="Please enter your Umami server URL",!1;try{var t=new URL(e.value);return"http:"!==t.protocol&&"https:"!==t.protocol?(e.setCustomValidity("URL must use http:// or https:// protocol"),l.urlValidation.textContent="URL must use http:// or https:// protocol",!1):(e.setCustomValidity(""),!0)}catch(t){return e.setCustomValidity("Please enter a valid URL"),l.urlValidation.textContent="Please enter a valid URL",!1}}function U(){try{u&&u.disconnect(),(u=chrome.runtime.connect({name:"keepAlive"})).onDisconnect.addListener((function(){setTimeout(U,1e3)}))}catch(e){setTimeout(U,5e3)}}l.togglePassword&&l.togglePassword.addEventListener("click",(function(){var e="password"===l.password.getAttribute("type")?"text":"password";l.password.setAttribute("type",e),l.togglePassword.querySelector("svg").innerHTML="password"===e?'\n        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>\n        <circle cx="12" cy="12" r="3"></circle>\n      ':'\n        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>\n        <line x1="1" y1="1" x2="23" y2="23"></line>\n      '})),document.addEventListener("DOMContentLoaded",(function(){f(),l.credentialsForm.addEventListener("submit",m),l.displayForm.addEventListener("submit",g),l.verifyButton.addEventListener("click",E),l.resetButton.addEventListener("click",b),l.baseUrl.addEventListener("input",(function(){return k(l.baseUrl)})),l.baseUrl.addEventListener("paste",(function(e){setTimeout((function(){return k(l.baseUrl)}),0)})),l.baseUrl.addEventListener("focus",(function(){l.urlHelp.style.opacity="0.5"})),l.baseUrl.addEventListener("blur",(function(){l.urlHelp.style.opacity="1"}))})),document.getElementById("updateBadgeButton").addEventListener("click",o(r().mark((function e(){var t;return r().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(e.prev=0,d("Requesting badge update...","success"),null!==(t=chrome.runtime)&&void 0!==t&&t.id){e.next=4;break}throw new Error("Extension context invalid or unavailable");case 4:return e.next=6,new Promise((function(e,t){chrome.runtime.sendMessage({type:"UPDATE_BADGE"},(function(r){chrome.runtime.lastError?t(new Error(chrome.runtime.lastError.message||"Failed to communicate with background service")):e(r||{success:!0})}))}));case 6:e.sent.success?d("Badge update successful!","success"):d("Badge update completed with warnings","warning"),e.next=14;break;case 10:e.prev=10,e.t0=e.catch(0),d("Badge update failed: "+e.t0.message,"error");case 14:case"end":return e.stop()}}),e,null,[[0,10]])})))),document.addEventListener("DOMContentLoaded",(function(){f(),U()}));