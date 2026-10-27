function api(path, method, body) { const request=new XMLHttpRequest();request.open(method||'GET',path,false);request.setRequestHeader('Content-Type','application/json');request.send(body?JSON.stringify(body):null);return JSON.parse(request.responseText||'{}'); }
function data(type, values) { return api('/api/data/'+type+(values?'?'+new URLSearchParams(values).toString():'')); }
