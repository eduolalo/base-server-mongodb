var Path = require('path'),
    fs = require("fs"),
    basePath = process.cwd(),
    language = 'en',
    langStrings = {},
    settings = JSON.parse(fs.readFileSync(Path.join(basePath, 'package.json')));
var i18n = module.exports;

i18n.extractStrings = function() {
    var readOrWriteFile = function(path, file, content) {
        var contentFile = null;
        try {
            contentFile = fs.readFileSync(file).toString();
        } catch (err) {
            try {
                fs.mkdirSync(path);
            } catch (e) {}
            fs.writeFileSync(file, "{}");
            contentFile = fs.readFileSync(file).toString();
        };
        return contentFile;
    };

    var languages = [],
        blacklist = [".git", "node_modules"],
        files = ["js", "html", "txt"];

    for (var i = 0; i < settings.languages.length; i++) {
        languages.push(settings.languages[i].code);
    };
    if (languages.length == 0) languages = ['en'];

    var results = [];
    var walk = function(dir) {
        var paths = fs.readdirSync(dir);
        paths.forEach(function(path) {
            if (blacklist.indexOf(path) === -1) {
                var dirpath = Path.join(dir, path);
                var stat = fs.statSync(dirpath);
                if (stat.isDirectory()) {
                    walk(dirpath)
                } else if (stat.isFile()) {
                    files.forEach(function(pattern) {
                        var reg = new RegExp(pattern + "$");
                        if (dirpath.match(reg)) {
                            results.push(dirpath);
                        };
                    });
                };
            };
        });
    };
    walk(basePath);

    var i = 0;
    var strings = {};
    results.forEach(function(file) {
        i++;
        var content = fs.readFileSync(file).toString();
        var matcher = function(regExp) {
            while (match = regExp.exec(content)) {
                if (match[1]) {
                    strings[match[1]] = "";
                };
            };
        };
        [new RegExp("\{\{ {0,}\_\_ {1,}\"([^\"]{1,})\" {0,}\}\}", "g"),
            new RegExp("\{\{ {0,}\_\_ {1,}\'([^\']{1,})\' {0,}\}\}", "g"),
            /__\(\"([^\"]{1,})\"\)/g,
            /__\(\'([^\'']{1,})\'\)/g,
            /__\(\"([^\"]{1,})\"/g,
            /__\(\'([^\'']{1,})\'/g,
        ].forEach(function(regExp) {
            matcher(regExp);
        });

    });

    languages.forEach(function(language) {

        var dir = Path.join(basePath, "languages");
        var languageFile = Path.join(dir, language + ".json");
        var contentFile = readOrWriteFile(dir, languageFile, "{}");

        var properties = JSON.parse(contentFile);
        for (word in strings) {
            if (!properties[word]) {
                properties[word] = "";
            };
        };

        fs.writeFileSync(languageFile, JSON.stringify(properties, null, 4));
    });
};

i18n.setLanguage = function(lang) {
    language = lang;
    var langFilePath = Path.join(basePath, 'languages', language + '.json');
    
    fs.readFile(langFilePath, function(err, fileContent) {
        // English will be default if language not found
        if(err) {
            language = 'en';
            langFilePath = Path.join(basePath, 'languages', language + '.json');
            fileContent = fs.readFileSync(langFilePath);
        };
        langStrings[language] = JSON.parse(fileContent.toString());
    });
};

i18n.getLanguage = function() {
    return language;
};

var processWord = function(msg, params) {
    var result = msg;
    for(var i in params) {
        result = result.replace('%(' + i + ')s', params[i], 'gi');
    };
    return result;
};

i18n.__ = function(msg, locale, params) {
    var langCode = locale || i18n.getLanguage();
    var langFilePath = Path.join(basePath, 'languages', langCode + '.json');
    if (!fs.existsSync(langFilePath)) {
        langFilePath = Path.join(basePath, 'languages', 'en' + '.json');
    };
    if (!langStrings[langCode]) {
        langStrings[langCode] = JSON.parse(fs.readFileSync(langFilePath).toString());
    };
    return (langStrings[langCode][msg] == '' || langStrings[langCode][msg] == undefined) ? processWord(msg, params || {}) : processWord(langStrings[langCode][msg], params || {});
};

i18n.init = function(req, res, next) {
    return function(req, res, next) {
        res.locals['__'] = i18n.__;
        req['setLanguage'] = function(lang) {
            return i18n.setLanguage(lang);
        };
        req['getLanguage'] = function() {
            return i18n.getLanguage();
        };

        res.locals['getLanguage'] = req['getLanguage'];
        if (req.user && req.user.locale) {
            req.setLanguage(req.user.locale);
        } else {
            var isoCode = 'en';
            if (req.acceptsLanguages) {
                isoCode = req.acceptsLanguages()[0];
            }
            isoCode = isoCode.split('-')[0];
            if (settings.languagesSupport.indexOf(isoCode)) {
                req.setLanguage(isoCode);
            } else {
                req.setLanguage('en');
            };
        };
        i18n.setLanguage(req.getLanguage());
        res.cookie(i18n.secret, req.getLanguage(), { maxAge: 315532800000 });
        next();
    };
};
