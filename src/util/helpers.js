const extend = function(source, properties) {
    for (let property in properties) {
        if (properties.hasOwnProperty(property)) {
            source[property] = properties[property];
        }
    }
    return source;
};

const serialize = function(obj, prefix) {
    let str = [];
    for(let p in obj) {
        if (! obj.hasOwnProperty(p)) {
            continue;
        }

        const k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
        if (typeof v == "object") {
            str.push(serialize(v, k))
        } else {
            str.push(encodeURIComponent(k) + "=" + encodeURIComponent(v))
        }
    }
    return str.join("&");
}

export {
    extend,
    serialize
}