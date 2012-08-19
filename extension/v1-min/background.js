var WEBSERVICE_URL="http://tabtaskmanager.appspot.com";var LOGIN_URL;var LOGOUT_URL;var CLOUD_INTERVAL=1000*60*1;var activeTasks=new Object();var user;var tabs=new Array();var cloudTimer;var getTimer;var key;window.onload=function(){$.get(WEBSERVICE_URL+"/login",function(a){LOGIN_URL=a.login;LOGOUT_URL=a.logout});loginAttempt()};chrome.extension.onRequest.addListener(function(c,b,a){if(c.type=="load_task"){delete (c.type);activeTasks[c.window]=c}else{if(c.type=="window_active"){a({response:(activeTasks[c.window]&&activeTasks[c.window].name==c.name)})}else{if(c.type=="get_user"){user.login=LOGIN_URL;user.logout=LOGOUT_URL;a(user)}else{if(c.type=="set_user"){user=c.user;persistLocal(c.immediate)}else{if(c.type=="delete_tabs"){deleteTabsFromTask(c.task)}else{if(c.type=="logged_in"){persistLocal();loginAttempt()}else{if(c.type=="clear"){localStorage.clear();loginAttempt()}else{if(c.type=="reset"){localStorage.clear();user={lastUpdated:0,tasks:[],email:"default"};persistLocal(true);loginAttempt()}}}}}}}}});function loginAttempt(){$.ajax(WEBSERVICE_URL,{method:"get",data:{user:true},success:function(a){key=SHA1(a);if(localStorage[a]){user=$.parseJSON(localStorage[a]);user.tasks=$.parseJSON(sjcl.decrypt(key,user.tasks))}else{user={lastUpdated:0,tasks:[],email:a}}getUser();getTimer=setInterval(getUser,CLOUD_INTERVAL)},error:function(b){key=SHA1("default");if(!localStorage["default"]){user={lastUpdated:0,tasks:[],email:"default"}}else{user=$.parseJSON(localStorage["default"]);try{user.tasks=$.parseJSON(sjcl.decrypt(key,user.tasks))}catch(a){user.tasks=[]}}}})}chrome.tabs.onAttached.addListener(function(a,b){updateTab(a,b.newWindowId)});chrome.tabs.onCreated.addListener(function(a){updateTab(a.id,a.windowId)});function updateTab(b,a){tabs[b]=a}chrome.tabs.onRemoved.addListener(function(e,b){var d=tabs[e];if(activeTasks[d]){if(b.isWindowClosing){delete activeTasks[d];persistUser()}else{var a=activeTasks[d].name;var c=user.tasks[indexOfTask(user.tasks,a)];if(c&&c.update){delete c.tabs[e];persistLocal()}}}});chrome.tabs.onUpdated.addListener(function(d,c,e){if(activeTasks[e.windowId]){var a=activeTasks[e.windowId].name;var b=user.tasks[indexOfTask(user.tasks,a)];if(b&&b.update){if(!b.tabs[d]){b.tabs[d]={}}b.tabs[d].url=e.url;b.tabs[d].title=e.title;b.tabs[d].favicon=e.favIconUrl;persistLocal()}}});function deleteTabsFromTask(a){user.tasks.filter(function(b){return b.name==a.name})[0].tabs={}}function getUser(){$.get(WEBSERVICE_URL,{time:user.lastUpdated},function(c){var b=user;if(c.tasks){console.log("from cloud");user=c;try{user.tasks=$.parseJSON(sjcl.decrypt(key,user.tasks));saveUser()}catch(a){user=b}}})}function saveUser(){if(!key){key=SHA1(user.email)}oldTasks=user.tasks;user.tasks=sjcl.encrypt(key,JSON.stringify(user.tasks));localStorage[user.email]=JSON.stringify(user);user.tasks=oldTasks}function persistLocal(a){saveUser();if(a){persistUser()}else{if(!cloudTimer&&user.email!="default"){cloudTimer=setTimeout(persistUser,CLOUD_INTERVAL)}}}function persistUser(){$.post(WEBSERVICE_URL,{tasks:sjcl.encrypt(key,JSON.stringify(user.tasks))},function(a){user.lastUpdated=parseFloat(a);saveUser()});cloudTimer=null}function SHA1(e){function d(A,j){var i=(A<<j)|(A>>>(32-j));return i}function u(C){var B="";var j;var D;var A;for(j=0;j<=6;j+=2){D=(C>>>(j*4+4))&15;A=(C>>>(j*4))&15;B+=D.toString(16)+A.toString(16)}return B}function w(C){var B="";var A;var j;for(A=7;A>=0;A--){j=(C>>>(A*4))&15;B+=j.toString(16)}return B}function b(j){j=j.replace(/\r\n/g,"\n");var i="";for(var B=0;B<j.length;B++){var A=j.charCodeAt(B);if(A<128){i+=String.fromCharCode(A)}else{if((A>127)&&(A<2048)){i+=String.fromCharCode((A>>6)|192);i+=String.fromCharCode((A&63)|128)}else{i+=String.fromCharCode((A>>12)|224);i+=String.fromCharCode(((A>>6)&63)|128);i+=String.fromCharCode((A&63)|128)}}}return i}var h;var y,x;var c=new Array(80);var n=1732584193;var l=4023233417;var k=2562383102;var g=271733878;var f=3285377520;var v,r,q,p,o;var z;e=b(e);var a=e.length;var m=new Array();for(y=0;y<a-3;y+=4){x=e.charCodeAt(y)<<24|e.charCodeAt(y+1)<<16|e.charCodeAt(y+2)<<8|e.charCodeAt(y+3);m.push(x)}switch(a%4){case 0:y=2147483648;break;case 1:y=e.charCodeAt(a-1)<<24|8388608;break;case 2:y=e.charCodeAt(a-2)<<24|e.charCodeAt(a-1)<<16|32768;break;case 3:y=e.charCodeAt(a-3)<<24|e.charCodeAt(a-2)<<16|e.charCodeAt(a-1)<<8|128;break}m.push(y);while((m.length%16)!=14){m.push(0)}m.push(a>>>29);m.push((a<<3)&4294967295);for(h=0;h<m.length;h+=16){for(y=0;y<16;y++){c[y]=m[h+y]}for(y=16;y<=79;y++){c[y]=d(c[y-3]^c[y-8]^c[y-14]^c[y-16],1)}v=n;r=l;q=k;p=g;o=f;for(y=0;y<=19;y++){z=(d(v,5)+((r&q)|(~r&p))+o+c[y]+1518500249)&4294967295;o=p;p=q;q=d(r,30);r=v;v=z}for(y=20;y<=39;y++){z=(d(v,5)+(r^q^p)+o+c[y]+1859775393)&4294967295;o=p;p=q;q=d(r,30);r=v;v=z}for(y=40;y<=59;y++){z=(d(v,5)+((r&q)|(r&p)|(q&p))+o+c[y]+2400959708)&4294967295;o=p;p=q;q=d(r,30);r=v;v=z}for(y=60;y<=79;y++){z=(d(v,5)+(r^q^p)+o+c[y]+3395469782)&4294967295;o=p;p=q;q=d(r,30);r=v;v=z}n=(n+v)&4294967295;l=(l+r)&4294967295;k=(k+q)&4294967295;g=(g+p)&4294967295;f=(f+o)&4294967295}var z=w(n)+w(l)+w(k)+w(g)+w(f);return z.toLowerCase()}"use strict";var sjcl={cipher:{},hash:{},keyexchange:{},mode:{},misc:{},codec:{},exception:{corrupt:function(b){this.toString=function(){return"CORRUPT: "+this.message};this.message=b},invalid:function(b){this.toString=function(){return"INVALID: "+this.message};this.message=b},bug:function(b){this.toString=function(){return"BUG: "+this.message};this.message=b},notReady:function(b){this.toString=function(){return"NOT READY: "+this.message};this.message=b}}};if(typeof module!="undefined"&&module.exports){module.exports=sjcl}sjcl.cipher.aes=function(j){this.h[0][0][0]||this.w();var i,p,o,n,m=this.h[0][4],l=this.h[1];i=j.length;var k=1;if(i!==4&&i!==6&&i!==8){throw new sjcl.exception.invalid("invalid aes key size")}this.a=[o=j.slice(0),n=[]];for(j=i;j<4*i+28;j++){p=o[j-1];if(j%i===0||i===8&&j%i===4){p=m[p>>>24]<<24^m[p>>16&255]<<16^m[p>>8&255]<<8^m[p&255];if(j%i===0){p=p<<8^p>>>24^k<<24;k=k<<1^(k>>7)*283}}o[j]=o[j-i]^p}for(i=0;j;i++,j--){p=o[i&3?j:j-4];n[i]=j<=4||i<4?p:l[0][m[p>>>24]]^l[1][m[p>>16&255]]^l[2][m[p>>8&255]]^l[3][m[p&255]]}};sjcl.cipher.aes.prototype={encrypt:function(b){return this.H(b,0)},decrypt:function(b){return this.H(b,1)},h:[[[],[],[],[],[]],[[],[],[],[],[]]],w:function(){var B=this.h[0],A=this.h[1],z=B[4],y=A[4],x,w,v,u=[],r=[],p,q,o,n;for(x=0;x<256;x++){r[(u[x]=x<<1^(x>>7)*283)^x]=x}for(w=v=0;!z[w];w^=p||1,v=r[v]||1){o=v^v<<1^v<<2^v<<3^v<<4;o=o>>8^o&255^99;z[w]=o;y[o]=w;q=u[x=u[p=u[w]]];n=q*16843009^x*65537^p*257^w*16843008;q=u[o]*257^o*16843008;for(x=0;x<4;x++){B[x][w]=q=q<<24^q>>>8;A[x][o]=n=n<<24^n>>>8}}for(x=0;x<5;x++){B[x]=B[x].slice(0);A[x]=A[x].slice(0)}},H:function(L,K){if(L.length!==4){throw new sjcl.exception.invalid("invalid aes block size")}var J=this.a[K],I=L[0]^J[0],H=L[K?3:1]^J[1],G=L[2]^J[2];L=L[K?1:3]^J[3];var F,E,D,B=J.length/4-2,C,A=4,z=[0,0,0,0];F=this.h[K];var y=F[0],x=F[1],w=F[2],v=F[3],u=F[4];for(C=0;C<B;C++){F=y[I>>>24]^x[H>>16&255]^w[G>>8&255]^v[L&255]^J[A];E=y[H>>>24]^x[G>>16&255]^w[L>>8&255]^v[I&255]^J[A+1];D=y[G>>>24]^x[L>>16&255]^w[I>>8&255]^v[H&255]^J[A+2];L=y[L>>>24]^x[I>>16&255]^w[H>>8&255]^v[G&255]^J[A+3];A+=4;I=F;H=E;G=D}for(C=0;C<4;C++){z[K?3&-C:C]=u[I>>>24]<<24^u[H>>16&255]<<16^u[G>>8&255]<<8^u[L&255]^J[A++];F=I;I=H;H=G;G=L;L=F}return z}};sjcl.bitArray={bitSlice:function(e,d,f){e=sjcl.bitArray.P(e.slice(d/32),32-(d&31)).slice(1);return f===undefined?e:sjcl.bitArray.clamp(e,f-d)},extract:function(f,e,h){var g=Math.floor(-e-h&31);return((e+h-1^e)&-32?f[e/32|0]<<32-g^f[e/32+1|0]>>>g:f[e/32|0]>>>g)&(1<<h)-1},concat:function(f,e){if(f.length===0||e.length===0){return f.concat(e)}var h=f[f.length-1],g=sjcl.bitArray.getPartial(h);return g===32?f.concat(e):sjcl.bitArray.P(e,g,h|0,f.slice(0,f.length-1))},bitLength:function(d){var c=d.length;if(c===0){return 0}return(c-1)*32+sjcl.bitArray.getPartial(d[c-1])},clamp:function(e,d){if(e.length*32<d){return e}e=e.slice(0,Math.ceil(d/32));var f=e.length;d&=31;if(f>0&&d){e[f-1]=sjcl.bitArray.partial(d,e[f-1]&2147483648>>d-1,1)}return e},partial:function(e,d,f){if(e===32){return d}return(f?d|0:d<<32-e)+e*1099511627776},getPartial:function(b){return Math.round(b/1099511627776)||32},equal:function(f,e){if(sjcl.bitArray.bitLength(f)!==sjcl.bitArray.bitLength(e)){return false}var h=0,g;for(g=0;g<f.length;g++){h|=f[g]^e[g]}return h===0},P:function(g,f,j,i){var h;h=0;if(i===undefined){i=[]}for(;f>=32;f-=32){i.push(j);j=0}if(f===0){return i.concat(g)}for(h=0;h<g.length;h++){i.push(j|g[h]>>>f);j=g[h]<<32-f}h=g.length?g[g.length-1]:0;g=sjcl.bitArray.getPartial(h);i.push(sjcl.bitArray.partial(f+g&31,f+g>32?j:i.pop(),1));return i},k:function(d,c){return[d[0]^c[0],d[1]^c[1],d[2]^c[2],d[3]^c[3]]}};sjcl.codec.utf8String={fromBits:function(g){var f="",j=sjcl.bitArray.bitLength(g),i,h;for(i=0;i<j/8;i++){if((i&3)===0){h=g[i/4]}f+=String.fromCharCode(h>>>24);h<<=8}return decodeURIComponent(escape(f))},toBits:function(f){f=unescape(encodeURIComponent(f));var e=[],h,g=0;for(h=0;h<f.length;h++){g=g<<8|f.charCodeAt(h);if((h&3)===3){e.push(g);g=0}}h&3&&e.push(sjcl.bitArray.partial(8*(h&3),g));return e}};sjcl.codec.hex={fromBits:function(e){var d="",f;for(f=0;f<e.length;f++){d+=((e[f]|0)+263882790666240).toString(16).substr(4)}return d.substr(0,sjcl.bitArray.bitLength(e)/4)},toBits:function(f){var e,h=[],g;f=f.replace(/\s|0x/g,"");g=f.length;f+="00000000";for(e=0;e<f.length;e+=8){h.push(parseInt(f.substr(e,8),16)^0)}return sjcl.bitArray.clamp(h,g*4)}};sjcl.codec.base64={D:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",fromBits:function(j,i,p){var o="",n=0,m=sjcl.codec.base64.D,l=0,k=sjcl.bitArray.bitLength(j);if(p){m=m.substr(0,62)+"-_"}for(p=0;o.length*6<k;){o+=m.charAt((l^j[p]>>>n)>>>26);if(n<6){l=j[p]<<6-n;n+=26;p++}else{l<<=6;n-=6}}for(;o.length&3&&!i;){o+="="}return o},toBits:function(i,h){i=i.replace(/\s|=/g,"");var n=[],m=0,l=sjcl.codec.base64.D,k=0,j;if(h){l=l.substr(0,62)+"-_"}for(h=0;h<i.length;h++){j=l.indexOf(i.charAt(h));if(j<0){throw new sjcl.exception.invalid("this isn't base64!")}if(m>26){m-=26;n.push(k^j>>>m);k=j<<32-m}else{m+=6;k^=j<<32-m}}m&56&&n.push(sjcl.bitArray.partial(m&56,k,1));return n}};sjcl.codec.base64url={fromBits:function(b){return sjcl.codec.base64.fromBits(b,1,1)},toBits:function(b){return sjcl.codec.base64.toBits(b,1)}};sjcl.hash.sha256=function(b){this.a[0]||this.w();if(b){this.n=b.n.slice(0);this.i=b.i.slice(0);this.e=b.e}else{this.reset()}};sjcl.hash.sha256.hash=function(b){return(new sjcl.hash.sha256).update(b).finalize()};sjcl.hash.sha256.prototype={blockSize:512,reset:function(){this.n=this.N.slice(0);this.i=[];this.e=0;return this},update:function(e){if(typeof e==="string"){e=sjcl.codec.utf8String.toBits(e)}var d,f=this.i=sjcl.bitArray.concat(this.i,e);d=this.e;e=this.e=d+sjcl.bitArray.bitLength(e);for(d=512+d&-512;d<=e;d+=512){this.C(f.splice(0,16))}return this},finalize:function(){var e,d=this.i,f=this.n;d=sjcl.bitArray.concat(d,[sjcl.bitArray.partial(1,1)]);for(e=d.length+2;e&15;e++){d.push(0)}d.push(Math.floor(this.e/4294967296));for(d.push(this.e|0);d.length;){this.C(d.splice(0,16))}this.reset();return f},N:[],a:[],w:function(){function f(a){return(a-Math.floor(a))*4294967296|0}var e=0,h=2,g;f:for(;e<64;h++){for(g=2;g*g<=h;g++){if(h%g===0){continue f}}if(e<8){this.N[e]=f(Math.pow(h,0.5))}this.a[e]=f(Math.pow(h,1/3));e++}},C:function(D){var C,B,A=D.slice(0),z=this.n,y=this.a,x=z[0],w=z[1],v=z[2],r=z[3],u=z[4],q=z[5],p=z[6],o=z[7];for(D=0;D<64;D++){if(D<16){C=A[D]}else{C=A[D+1&15];B=A[D+14&15];C=A[D&15]=(C>>>7^C>>>18^C>>>3^C<<25^C<<14)+(B>>>17^B>>>19^B>>>10^B<<15^B<<13)+A[D&15]+A[D+9&15]|0}C=C+o+(u>>>6^u>>>11^u>>>25^u<<26^u<<21^u<<7)+(p^u&(q^p))+y[D];o=p;p=q;q=u;u=r+C|0;r=v;v=w;w=x;x=C+(w&v^r&(w^v))+(w>>>2^w>>>13^w>>>22^w<<30^w<<19^w<<10)|0}z[0]=z[0]+x|0;z[1]=z[1]+w|0;z[2]=z[2]+v|0;z[3]=z[3]+r|0;z[4]=z[4]+u|0;z[5]=z[5]+q|0;z[6]=z[6]+p|0;z[7]=z[7]+o|0}};sjcl.mode.ccm={name:"ccm",encrypt:function(v,u,r,q,p){var o,n=u.slice(0),m=sjcl.bitArray,l=m.bitLength(r)/8,j=m.bitLength(n)/8;p=p||64;q=q||[];if(l<7){throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes")}for(o=2;o<4&&j>>>8*o;o++){}if(o<15-l){o=15-l}r=m.clamp(r,8*(15-o));u=sjcl.mode.ccm.G(v,u,r,q,p,o);n=sjcl.mode.ccm.I(v,n,r,u,p,o);return m.concat(n.data,n.tag)},decrypt:function(v,u,r,q,p){p=p||64;q=q||[];var o=sjcl.bitArray,n=o.bitLength(r)/8,m=o.bitLength(u),l=o.clamp(u,m-p),j=o.bitSlice(u,m-p);m=(m-p)/8;if(n<7){throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes")}for(u=2;u<4&&m>>>8*u;u++){}if(u<15-n){u=15-n}r=o.clamp(r,8*(15-u));l=sjcl.mode.ccm.I(v,l,r,j,p,u);v=sjcl.mode.ccm.G(v,l.data,r,q,p,u);if(!o.equal(l.tag,v)){throw new sjcl.exception.corrupt("ccm: tag doesn't match")}return l.data},G:function(r,q,p,o,n,m){var l=[],k=sjcl.bitArray,j=k.k;n/=8;if(n%2||n<4||n>16){throw new sjcl.exception.invalid("ccm: invalid tag length")}if(o.length>4294967295||q.length>4294967295){throw new sjcl.exception.bug("ccm: can't deal with 4GiB or more data")}m=[k.partial(8,(o.length?64:0)|n-2<<2|m-1)];m=k.concat(m,p);m[3]|=k.bitLength(q)/8;m=r.encrypt(m);if(o.length){p=k.bitLength(o)/8;if(p<=65279){l=[k.partial(16,p)]}else{if(p<=4294967295){l=k.concat([k.partial(16,65534)],[p])}}l=k.concat(l,o);for(o=0;o<l.length;o+=4){m=r.encrypt(j(m,l.slice(o,o+4).concat([0,0,0])))}}for(o=0;o<q.length;o+=4){m=r.encrypt(j(m,q.slice(o,o+4).concat([0,0,0])))}return k.clamp(m,n*8)},I:function(v,u,r,q,p,o){var n,m=sjcl.bitArray;n=m.k;var l=u.length,j=m.bitLength(u);r=m.concat([m.partial(8,o-1)],r).concat([0,0,0]).slice(0,4);q=m.bitSlice(n(q,v.encrypt(r)),0,p);if(!l){return{tag:q,data:[]}}for(n=0;n<l;n+=4){r[3]++;p=v.encrypt(r);u[n]^=p[0];u[n+1]^=p[1];u[n+2]^=p[2];u[n+3]^=p[3]}return{tag:q,data:m.clamp(u,j)}}};sjcl.mode.ocb2={name:"ocb2",encrypt:function(B,A,z,y,x,w){if(sjcl.bitArray.bitLength(z)!==128){throw new sjcl.exception.invalid("ocb iv must be 128 bits")}var v,u=sjcl.mode.ocb2.A,r=sjcl.bitArray,p=r.k,q=[0,0,0,0];z=u(B.encrypt(z));var o,n=[];y=y||[];x=x||64;for(v=0;v+4<A.length;v+=4){o=A.slice(v,v+4);q=p(q,o);n=n.concat(p(z,B.encrypt(p(z,o))));z=u(z)}o=A.slice(v);A=r.bitLength(o);v=B.encrypt(p(z,[0,0,0,A]));o=r.clamp(p(o.concat([0,0,0]),v),A);q=p(q,p(o.concat([0,0,0]),v));q=B.encrypt(p(q,p(z,u(z))));if(y.length){q=p(q,w?y:sjcl.mode.ocb2.pmac(B,y))}return n.concat(r.concat(o,r.clamp(q,x)))},decrypt:function(F,E,D,C,B,A){if(sjcl.bitArray.bitLength(D)!==128){throw new sjcl.exception.invalid("ocb iv must be 128 bits")}B=B||64;var z=sjcl.mode.ocb2.A,y=sjcl.bitArray,x=y.k,v=[0,0,0,0],w=z(F.encrypt(D)),u,r,q=sjcl.bitArray.bitLength(E)-B,p=[];C=C||[];for(D=0;D+4<q/32;D+=4){u=x(w,F.decrypt(x(w,E.slice(D,D+4))));v=x(v,u);p=p.concat(u);w=z(w)}r=q-D*32;u=F.encrypt(x(w,[0,0,0,r]));u=x(u,y.clamp(E.slice(D),r).concat([0,0,0]));v=x(v,u);v=F.encrypt(x(v,x(w,z(w))));if(C.length){v=x(v,A?C:sjcl.mode.ocb2.pmac(F,C))}if(!y.equal(y.clamp(v,B),y.bitSlice(E,q))){throw new sjcl.exception.corrupt("ocb: tag doesn't match")}return p.concat(y.clamp(u,r))},pmac:function(j,i){var p,o=sjcl.mode.ocb2.A,n=sjcl.bitArray,m=n.k,l=[0,0,0,0],k=j.encrypt([0,0,0,0]);k=m(k,o(o(k)));for(p=0;p+4<i.length;p+=4){k=o(k);l=m(l,j.encrypt(m(k,i.slice(p,p+4))))}i=i.slice(p);if(n.bitLength(i)<128){k=m(k,o(k));i=n.concat(i,[2147483648|0,0,0,0])}l=m(l,i);return j.encrypt(m(o(m(k,o(k))),l))},A:function(b){return[b[0]<<1^b[1]>>>31,b[1]<<1^b[2]>>>31,b[2]<<1^b[3]>>>31,b[3]<<1^(b[0]>>>31)*135]}};sjcl.misc.hmac=function(f,e){this.M=e=e||sjcl.hash.sha256;var h=[[],[]],g=e.prototype.blockSize/32;this.l=[new e,new e];if(f.length>g){f=e.hash(f)}for(e=0;e<g;e++){h[0][e]=f[e]^909522486;h[1][e]=f[e]^1549556828}this.l[0].update(h[0]);this.l[1].update(h[1])};sjcl.misc.hmac.prototype.encrypt=sjcl.misc.hmac.prototype.mac=function(d,c){d=(new this.M(this.l[0])).update(d,c).finalize();return(new this.M(this.l[1])).update(d).finalize()};sjcl.misc.pbkdf2=function(x,w,v,u,r){v=v||1000;if(u<0||v<0){throw sjcl.exception.invalid("invalid params to pbkdf2")}if(typeof x==="string"){x=sjcl.codec.utf8String.toBits(x)}r=r||sjcl.misc.hmac;x=new r(x);var q,p,o,n,l=[],m=sjcl.bitArray;for(n=1;32*l.length<(u||1);n++){r=q=x.encrypt(m.concat(w,[n]));for(p=1;p<v;p++){q=x.encrypt(q);for(o=0;o<q.length;o++){r[o]^=q[o]}}l=l.concat(r)}if(u){l=m.clamp(l,u)}return l};sjcl.random={randomWords:function(f,e){var h=[];e=this.isReady(e);var g;if(e===0){throw new sjcl.exception.notReady("generator isn't seeded")}else{e&2&&this.U(!(e&1))}for(e=0;e<f;e+=4){(e+1)%65536===0&&this.L();g=this.u();h.push(g[0],g[1],g[2],g[3])}this.L();return h.slice(0,f)},setDefaultParanoia:function(b){this.t=b},addEntropy:function(j,i,p){p=p||"user";var o,n,m=(new Date).valueOf(),l=this.q[p],k=this.isReady();o=this.F[p];if(o===undefined){o=this.F[p]=this.R++}if(l===undefined){l=this.q[p]=0}this.q[p]=(this.q[p]+1)%this.b.length;switch(typeof j){case"number":break;case"object":if(i===undefined){for(p=i=0;p<j.length;p++){for(n=j[p];n>0;){i++;n>>>=1}}}this.b[l].update([o,this.J++,2,i,m,j.length].concat(j));break;case"string":if(i===undefined){i=j.length}this.b[l].update([o,this.J++,3,i,m,j.length]);this.b[l].update(j);break;default:throw new sjcl.exception.bug("random: addEntropy only supports number, array or string")}this.j[l]+=i;this.f+=i;if(k===0){this.isReady()!==0&&this.K("seeded",Math.max(this.g,this.f));this.K("progress",this.getProgress())}},isReady:function(b){b=this.B[b!==undefined?b:this.t];return this.g&&this.g>=b?this.j[0]>80&&(new Date).valueOf()>this.O?3:1:this.f>=b?2:0},getProgress:function(b){b=this.B[b?b:this.t];return this.g>=b?1["0"]:this.f>b?1["0"]:this.f/b},startCollectors:function(){if(!this.m){if(window.addEventListener){window.addEventListener("load",this.o,false);window.addEventListener("mousemove",this.p,false)}else{if(document.attachEvent){document.attachEvent("onload",this.o);document.attachEvent("onmousemove",this.p)}else{throw new sjcl.exception.bug("can't attach event")}}this.m=true}},stopCollectors:function(){if(this.m){if(window.removeEventListener){window.removeEventListener("load",this.o,false);window.removeEventListener("mousemove",this.p,false)}else{if(window.detachEvent){window.detachEvent("onload",this.o);window.detachEvent("onmousemove",this.p)}}this.m=false}},addEventListener:function(d,c){this.r[d][this.Q++]=c},removeEventListener:function(f,e){var h;f=this.r[f];var g=[];for(h in f){f.hasOwnProperty(h)&&f[h]===e&&g.push(h)}for(e=0;e<g.length;e++){h=g[e];delete f[h]}},b:[new sjcl.hash.sha256],j:[0],z:0,q:{},J:0,F:{},R:0,g:0,f:0,O:0,a:[0,0,0,0,0,0,0,0],d:[0,0,0,0],s:undefined,t:6,m:false,r:{progress:{},seeded:{}},Q:0,B:[0,48,64,96,128,192,256,384,512,768,1024],u:function(){for(var b=0;b<4;b++){this.d[b]=this.d[b]+1|0;if(this.d[b]){break}}return this.s.encrypt(this.d)},L:function(){this.a=this.u().concat(this.u());this.s=new sjcl.cipher.aes(this.a)},T:function(b){this.a=sjcl.hash.sha256.hash(this.a.concat(b));this.s=new sjcl.cipher.aes(this.a);for(b=0;b<4;b++){this.d[b]=this.d[b]+1|0;if(this.d[b]){break}}},U:function(f){var e=[],h=0,g;this.O=e[0]=(new Date).valueOf()+30000;for(g=0;g<16;g++){e.push(Math.random()*4294967296|0)}for(g=0;g<this.b.length;g++){e=e.concat(this.b[g].finalize());h+=this.j[g];this.j[g]=0;if(!f&&this.z&1<<g){break}}if(this.z>=1<<this.b.length){this.b.push(new sjcl.hash.sha256);this.j.push(0)}this.f-=h;if(h>this.g){this.g=h}this.z++;this.T(e)},p:function(b){sjcl.random.addEntropy([b.x||b.clientX||b.offsetX,b.y||b.clientY||b.offsetY],2,"mouse")},o:function(){sjcl.random.addEntropy(new Date,2,"loadtime")},K:function(f,e){var h;f=sjcl.random.r[f];var g=[];for(h in f){f.hasOwnProperty(h)&&g.push(f[h])}for(h=0;h<g.length;h++){g[h](e)}}};try{var s=new Uint32Array(32);crypto.getRandomValues(s);sjcl.random.addEntropy(s,1024,"crypto['getRandomValues']")}catch(t){}sjcl.json={defaults:{v:1,iter:1000,ks:128,ts:64,mode:"ccm",adata:"",cipher:"aes"},encrypt:function(i,h,n,m){n=n||{};m=m||{};var l=sjcl.json,k=l.c({iv:sjcl.random.randomWords(4,0)},l.defaults),j;l.c(k,n);n=k.adata;if(typeof k.salt==="string"){k.salt=sjcl.codec.base64.toBits(k.salt)}if(typeof k.iv==="string"){k.iv=sjcl.codec.base64.toBits(k.iv)}if(!sjcl.mode[k.mode]||!sjcl.cipher[k.cipher]||typeof i==="string"&&k.iter<=100||k.ts!==64&&k.ts!==96&&k.ts!==128||k.ks!==128&&k.ks!==192&&k.ks!==256||k.iv.length<2||k.iv.length>4){throw new sjcl.exception.invalid("json encrypt: invalid parameters")}if(typeof i==="string"){j=sjcl.misc.cachedPbkdf2(i,k);i=j.key.slice(0,k.ks/32);k.salt=j.salt}if(typeof h==="string"){h=sjcl.codec.utf8String.toBits(h)}if(typeof n==="string"){n=sjcl.codec.utf8String.toBits(n)}j=new sjcl.cipher[k.cipher](i);l.c(m,k);m.key=i;k.ct=sjcl.mode[k.mode].encrypt(j,h,k.iv,n,k.ts);return l.encode(l.V(k,l.defaults))},decrypt:function(h,g,l,k){l=l||{};k=k||{};var j=sjcl.json;g=j.c(j.c(j.c({},j.defaults),j.decode(g)),l,true);var i;l=g.adata;if(typeof g.salt==="string"){g.salt=sjcl.codec.base64.toBits(g.salt)}if(typeof g.iv==="string"){g.iv=sjcl.codec.base64.toBits(g.iv)}if(!sjcl.mode[g.mode]||!sjcl.cipher[g.cipher]||typeof h==="string"&&g.iter<=100||g.ts!==64&&g.ts!==96&&g.ts!==128||g.ks!==128&&g.ks!==192&&g.ks!==256||!g.iv||g.iv.length<2||g.iv.length>4){throw new sjcl.exception.invalid("json decrypt: invalid parameters")}if(typeof h==="string"){i=sjcl.misc.cachedPbkdf2(h,g);h=i.key.slice(0,g.ks/32);g.salt=i.salt}if(typeof l==="string"){l=sjcl.codec.utf8String.toBits(l)}i=new sjcl.cipher[g.cipher](h);l=sjcl.mode[g.mode].decrypt(i,g.ct,g.iv,l,g.ts);j.c(k,g);k.key=h;return sjcl.codec.utf8String.fromBits(l)},encode:function(f){var e,h="{",g="";for(e in f){if(f.hasOwnProperty(e)){if(!e.match(/^[a-z0-9]+$/i)){throw new sjcl.exception.invalid("json encode: invalid property name")}h+=g+'"'+e+'":';g=",";switch(typeof f[e]){case"number":case"boolean":h+=f[e];break;case"string":h+='"'+escape(f[e])+'"';break;case"object":h+='"'+sjcl.codec.base64.fromBits(f[e],1)+'"';break;default:throw new sjcl.exception.bug("json encode: unsupported type")}}}return h+"}"},decode:function(f){f=f.replace(/\s/g,"");if(!f.match(/^\{.*\}$/)){throw new sjcl.exception.invalid("json decode: this isn't json!")}f=f.replace(/^\{|\}$/g,"").split(/,/);var e={},h,g;for(h=0;h<f.length;h++){if(!(g=f[h].match(/^(?:(["']?)([a-z][a-z0-9]*)\1):(?:(\d+)|"([a-z0-9+\/%*_.@=\-]*)")$/i))){throw new sjcl.exception.invalid("json decode: this isn't json!")}e[g[2]]=g[3]?parseInt(g[3],10):g[2].match(/^(ct|salt|iv)$/)?sjcl.codec.base64.toBits(g[4]):unescape(g[4])}return e},c:function(f,e,h){if(f===undefined){f={}}if(e===undefined){return f}var g;for(g in e){if(e.hasOwnProperty(g)){if(h&&f[g]!==undefined&&f[g]!==e[g]){throw new sjcl.exception.invalid("required parameter overridden")}f[g]=e[g]}}return f},V:function(f,e){var h={},g;for(g in f){if(f.hasOwnProperty(g)&&f[g]!==e[g]){h[g]=f[g]}}return h},W:function(f,e){var h={},g;for(g=0;g<e.length;g++){if(f[e[g]]!==undefined){h[e[g]]=f[e[g]]}}return h}};sjcl.encrypt=sjcl.json.encrypt;sjcl.decrypt=sjcl.json.decrypt;sjcl.misc.S={};sjcl.misc.cachedPbkdf2=function(f,e){var h=sjcl.misc.S,g;e=e||{};g=e.iter||1000;h=h[f]=h[f]||{};g=h[g]=h[g]||{firstSalt:e.salt&&e.salt.length?e.salt.slice(0):sjcl.random.randomWords(2,0)};h=e.salt===undefined?g.firstSalt:e.salt;g[h]=g[h]||sjcl.misc.pbkdf2(f,h,e.iter);return{key:g[h].slice(0),salt:h.slice(0)}};