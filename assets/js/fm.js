function FileManager(options) {
    var self = this;
    var driver = false;

    self.options = options;
    self.config = {
        driver: 'Dropbox',
        token: ''
    };

    self.drivers = ['Dropbox', 'Google', 'S3'];

    self.init = function () {
        self.setConfig();

        if (self.optionsValidation()) {
            self.setDriver();
        }
    };

    self.setConfig = function() {
        for (var k in self.options) {
            self.config[k] = self.options[k];
        }
    };

    self.setDriver = function () {
        if (self.config.driver) {
            for (var k in self.drivers) {
                if (self.config.driver.toLowerCase() == self.drivers[k].toLowerCase()) {
                    driver = new window[self.drivers[k] + 'API'](self.config);
                }
            }
        }
    };

    self.getAvailableDrivers = function() {
        return self.drivers;
    };

    self.optionsValidation = function() {
        if ( self.config.token.length < 10) {
            console.error('Invalid Access Token')
            return false;
        }

        return true;
    };

    self.getData = function (options) {
        return driver.getData(options);
    };

    self.createFolder = function(options) {
        return driver.createForlder(options);
    };

    self.delete = function(options) {
        return driver.delete(options);
    };

    self.moveSingle = function(options) {
        return driver.moveSingle(options);
    };

    self.copySingle = function(options) {
        return driver.copySingle(options);
    };

    self.getTempFileLink = function(options) {
        return driver.getTempFileLink(options);
    };

    self.uploadFile = function(options) {
        return driver.uploadFile(options);
    };

    self.getMetaData = function(options) {
        return driver.getMetaData(options);
    };

    self.getCurrentUser = function(options) {
        return driver.usersGetCurrentAccount(options);
    };

    self.getThumbnail = function(options) {
        return driver.getThumbnail(options);
    };

    self.getPreview = function(options) {
        return driver.getPreview(options);
    };

    self.changeName = function(options){
        return driver.changeName(options);
    };

    self.getAllFolders = function(options) {
        return driver.getAllFolders(options);
    };

    self.init();
};

function DropboxAPI(args) {
    var self = this;
    var driver = new Dropbox.Dropbox({accessToken: args.token});

    self.getData = function (options) { //path, type, sortBy, recursive, callback, error
        var validTypes = ['file', 'folder'];
        var sortable = ['name', 'size', 'date'];
        options.path = options.path.length <= 1 ? '' : options.path;
        options.type = options.type ? options.type.toLowerCase() : 'all';
        options.type = validTypes.indexOf(options.type) == -1 ? 'all' : options.type;
        options.sortBy = options.sortBy ? options.sortBy.toLowerCase() : 'name';
        options.sortBy = sortable.indexOf(options.sortBy) == -1 ? 'name' : options.sortBy;
        options.recursive = typeof(options.recursive) === 'boolean' ? options.recursive : false;
        options.cache = typeof(args.cache) === 'boolean' ? args.cache : false;

        self.sendFromCache(options);
    };

    self.sendFromCache = function(options) {
        var dataToSend = JSON.parse(window.localStorage.getItem(options.path));
        
        if (dataToSend && options.cache) {
            self.sendData(options, dataToSend);
        } else {
            driver.filesListFolder({path: options.path, recursive: options.recursive})
            .then(function(data) {
                if (options.cache) {
                    window.localStorage.setItem(options.path, JSON.stringify(data.entries));
                }

                self.sendData(options, data.entries);
            })
            .catch(function(error) {
                console.error(error);
                if (options.error) {
                    options.error(error);
                }
            });
        }
    };

    self.sendData = function(options, dataToSend) {
        var finalData = [];

        if (options.type == 'all') {
            finalData = dataToSend;
        } else {
           for (var k in dataToSend) {
                if (Object.values(dataToSend[k])[0] == options.type) {
                    finalData.push(dataToSend[k]);
                }
            } 
        }

        switch(options.sortBy){
            case 'name': sortByName(finalData);
            break;
            case 'size': sortBySize(finalData);
            break;
            case 'date': sortByDate(finalData);
            break;
        }
        
        if (options.callback) {
            options.callback(finalData);
        }

    };

    function sortByName(array) {
        array.sort(function(a, b){
            var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();

            if (nameA < nameB) 
                return -1;
            if (nameA > nameB)
                return 1;

            return 0;
        });

        return array;
    };

    function sortBySize(array) {
        array.sort(function(a, b){
            return a.size-b.size;
        });

        return array;
    };

    function sortByDate(array) {
        array.sort(function(a, b){
            var dateA=new Date(a.retiredate), dateB=new Date(b.retiredate)
            return dateA-dateB;
        });

        return array;
    };

    self.createForlder = function(options) { //path, callback, error
        return driver.filesCreateFolderV2({path: options.path, autorename: options.autorename})
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.error(error);
            }
        });
    };

    self.delete = function(options) {
        driver.filesDeleteV2({path: options.path})
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error('Path not found');
            if (options.error) {
                options.options.error(error);
            }
        });
    };

    self.moveSingle = function(options) { //pathFrom, pathTo, autorename, callback, error
        return driver.filesMoveV2({from_path: options.pathFrom, to_path: options.pathTo, autorename: options.autorename})
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.error(error);
            }
        });
    };

    self.copySingle = function(options) { //pathFrom, pathTo, autorename, callback, error
        driver.filesCopyV2({from_path: options.pathFrom, to_path: options.pathTo, autorename: options.autorename})
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.options.error(error);
            }
        }); 
    };

    self.getTempFileLink = function(options) {
        driver.filesGetTemporaryLink({path: options.path})
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.error(error);
            }
        });
    };

    self.uploadFile = function(options) { //file, path, callback, error
        driver.filesUpload({path: options.path, contents: options.file})
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.error(error);
            }
        });
    };

    self.getMetaData = function(options) {
        driver.filesGetMetadata({path: options.path, include_media_info : true})
       .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
       })
       .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.error(error);
            }
       });
    };

    self.usersGetCurrentAccount = function(options) {
        driver.usersGetCurrentAccount()
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.error(error);
            }
        });
    };

    self.getThumbnail = function(options) { //path, format, size, callback, error
        driver.filesGetThumbnail({path: options.path, format: options.format, size: options.size})
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.error(error);
            }
        });
    };

    self.getPreview = function(options) {
        return driver.filesGetPreview({path: options.path})
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.error(error);
            }
        });
    };

    self.changeName = function(options) { //path, newName, autorename, callback, error
        var finalName = options.path.substr(0 ,options.path.lastIndexOf('/') + 1) + options.newName;
        driver.filesMoveV2({from_path: options.path, to_path: finalName, autorename: options.autorename})
        .then(function(data) {
            if (options.callback) {
                options.callback(data);
            }
        })
        .catch(function(error) {
            console.error(error);
            if (options.error) {
                options.error(error);
            }
        });
    };
};