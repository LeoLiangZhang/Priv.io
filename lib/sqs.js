function addZero(n) {
    return ( n < 0 || n > 9 ? "" : "0" ) + n;
}

var sqs = (function(){
/////////////////// Auth /////////////////////////////////////////////////////

//Date.prototype.toISODate =
//        new Function("with (this)\n    return " +
//           "getFullYear()+'-'+addZero(getMonth()+1)+'-'" +
//           "+addZero(getDate())+'T'+addZero(getHours())+':'" +
//           "+addZero(getMinutes())+':'+addZero(getSeconds())+'.000Z'");

Date.prototype.toISODate =	function(){
		return this.getFullYear()+'-'+addZero(this.getMonth()+1)+'-'
		+addZero(this.getDate())+'T'+addZero(this.getHours())+':'
		+addZero(this.getMinutes())+':'+addZero(this.getSeconds())+'.000Z';
};


function getNowTimeStamp() {
    var time = new Date();
    var gmtTime = new Date(time.getTime() + (time.getTimezoneOffset() * 60000));
    return gmtTime.toISODate() ;
}

function ignoreCaseSort(a, b) {
    var ret = 0;
    a = a.toLowerCase();
    b = b.toLowerCase();
    if(a > b) ret = 1;
    if(a < b) ret = -1;
    return ret;
}

function generateV1Signature(url, key) {
        var stringToSign = getStringToSign(url);
        var signed = shautils.base64_hmac(key, stringToSign);
        return signed;
}

/////////////////// String To Sign /////////////////////////////////////////////////////
function getStringToSign(url) {

    var stringToSign = "";
    var query = url.split("?")[1];

    var params = query.split("&");
    params.sort(ignoreCaseSort);
    for (var i = 0; i < params.length; i++) {
        var param = params[i].split("=");
        var name =   param[0];
        var value =  param[1];
        if (name == 'Signature' || undefined  == value) continue;
            stringToSign += name;
            stringToSign += decodeURIComponent(value);
         }

    return stringToSign;
}

/////////////////// Signed URL /////////////////////////////////////////////////////
function generateSignedURL(actionName, form, accessKeyId, secretKey, endpoint, version) {
   var url = endpoint + "?SignatureVersion=1&Action=" + actionName + "&Version=" + encodeURIComponent(version) + "&";
//   for (var i = 0; i < form.elements.length; ++i) {
//	           var elementName = form.elements[i].name;
//
//	        var elementValue = null;
//
//	           if (form.elements[i].type == 'text') {
//	            elementValue = form.elements[i].value;
//	        } else if (form.elements[i].type == 'select-one') {
//	            elementValue = form.elements[i].options[form.elements[i].selectedIndex].value;
//	        }
//	        if (elementValue) {
//	                   url += elementName;
//	                   url += "=";
//	                   url += encodeURIComponent(elementValue);
//	                   url += "&";
//	        }
//   }

    for(var i in form){
        var elementName = i;
        var elementValue = form[i];
        if (elementValue) {
            url += elementName;
            url += "=";
            url += encodeURIComponent(elementValue);
            url += "&";
        }
    }

   var timestamp = getNowTimeStamp();
   url += "Timestamp=" + encodeURIComponent(timestamp);

   url += "&AWSAccessKeyId=" + encodeURIComponent(accessKeyId);
   var signature = generateV1Signature(url, secretKey);
   url += "&Signature=" + encodeURIComponent(signature);

   return url;
}

/////////////////// Build Form Fields /////////////////////////////////////////////////////
function getFormFieldsFromUrl (url) {
    var fields  = "";
    var query = url.split("?")[1];
    var params = query.split("&");
    for (var i = 0; i < params.length; i++) {
        var param = params[i].split("=");
        var name =   param[0];
        var value =  param[1];
         fields += "<input type=\"hidden\" name=\""+name+"\" value=\""+decodeURIComponent(value)+"\">";
    }
    return fields;
}

return {generateSignedURL: generateSignedURL, getFormFieldsFromUrl: getFormFieldsFromUrl, getStringToSign: getStringToSign};
})();

window.sqs = sqs;
