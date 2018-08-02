angular.module('app', []);

angular.module('app').controller('AppCtrl', function ($scope) {
	var fm = new FileManager({
		driver: 'dropbox',
		token: 'your token goes here',
		cache: false
	});
	$scope.selectedFolder = 0;
	$scope.selectFile = -1;
	$scope.currentPathLength = -1;
	$scope.currentFolder = [];
	$scope.currentFiles = [];
	$scope.allFolders = [];
	$scope.allFiles = [];
	$scope.pathsHistory = [];
	$scope.itemToCopy = '';
	$scope.pasteFolderName = '';
	$scope.createFolderName = '';
	$scope.currentUser = {};
	$scope.availableDrivers = [];
	$scope.pathButtons = [];
	$scope.thumbnail = '/assets/img/Folder-icon.png';
	$scope.metaData = {'path_display': 'root', 'name': 'root'};
	$scope.type = 'folder';
	$scope.sortBy = 'Name';
	$scope.supported = {
		'images': ['.jpg', '.png', '.gif'], 
		'previews': ['.ai', '.doc', '.docm', '.docx', '.eps', '.odp', '.odt', '.pps', '.ppsm', '.ppsx', '.ppt', '.pptm', '.pptx', '.rtf']
	};
	$scope.tempLink = '';
	$scope.isNameEdit = false;

	$scope.init = function() {
		$scope.getAll('/');
		$scope.getCurrentUser();
		$scope.availableDrivers = fm.getAvailableDrivers();
	};

	$scope.selectFolder = function(index) {
		$scope.selectedFolder = index;
	};

	$scope.selectFile = function(index) {
		$scope.selectedFile = index;
	}; 

	$scope.changeFolderTo = function(path) {
		path = path == '/' ? '' : path;

		if ($scope.pathsHistory[$scope.pathsHistory.length - 1] != path) {
			$scope.pathsHistory.push(path);

			for (var f in $scope.pathsHistory) {
				var folderName = $scope.pathsHistory[f].slice($scope.pathsHistory[f].lastIndexOf('/') + 1, $scope.pathsHistory[f].length);
				if ($scope.pathButtons.indexOf(folderName) == -1) {
					$scope.pathButtons.push(folderName);
				}
			}
		}

		path = path.length > 1 ? path + '/' : '/';
		$scope.currentPathLength = path.match(/\//gi).length;
		$scope.currentFolder = [];
		$scope.currentFiles = [];

		for (var k in $scope.allFolders) {
			var folderPathLength = $scope.allFolders[k].path_lower.match(/\//gi).length;

			if ($scope.allFolders[k].path_lower.indexOf(path) > -1 &&  $scope.currentPathLength == folderPathLength) {
				$scope.currentFolder.push($scope.allFolders[k]);	
			}
		}

		for (var k in $scope.allFiles) {
			var filePathLength = $scope.allFiles[k].path_lower.match(/\//gi).length;

			if ($scope.allFiles[k].path_lower.indexOf(path) > -1 &&  $scope.currentPathLength == filePathLength) {
				$scope.currentFiles.push($scope.allFiles[k]);	
			}
		}
	};

	$scope.getAll = function(path) {
		fm.getData({
			path: path,
			callback: function(data) {
				$scope.selectedFolder = -1;
				$scope.allFolders = data;
				$scope.changeFolderTo(path);
				// if cache == false then $scope.$apply() needed to change view;
				$scope.$apply();
			},
			type: 'folder',
			recursive: false,
		});

		fm.getData({
			path: path,
			callback: function(data) {
				$scope.selectedFile = -1;
				$scope.allFiles = data;
				$scope.changeFolderTo(path);
				// if cache == false then $scope.$apply() needed to change view;
				$scope.$apply();
			},
			type: 'file',
			recursive: false
		});
	};

	$scope.refresh = function() {
		$scope.getAll($scope.pathsHistory[$scope.pathsHistory.length - 1]);

	};

	$scope.delete = function(path) {
		if (confirm('You really want to delete ?')) {
			fm.delete({
				path: path, 
				callback: function(data) {
					$scope.refresh();
				}
			}
			);
		}
	};

	$scope.back = function() {
		if ($scope.pathsHistory.length > 1) {
			$scope.pathsHistory.pop();
			$scope.pathButtons.pop();
			$scope.getAll($scope.pathsHistory.pop());
		}
	};

	$scope.backTo = function(index) {
		$scope.pathButtons.splice(index + 1, $scope.pathButtons.length - index + 1);
		$scope.pathsHistory.splice(index + 1, $scope.pathsHistory.length - index + 1);
		$scope.getAll($scope.pathsHistory[$scope.pathsHistory.length - 1]);
	};

	$scope.copy = function(path) {
		$scope.itemToCopy = path;
		$scope.pasteFolderName = path.slice(path.lastIndexOf('/') + 1, path.length);
	};

	$scope.paste = function() {
		var pathToCopy = $scope.pathsHistory[$scope.pathsHistory.length - 1] + '/' + $scope.pasteFolderName;
		fm.copySingle({
			pathFrom: $scope.itemToCopy,
			pathTo: pathToCopy,
			autorename: true,
			callback: function(data) {
				$scope.refresh();
			}
		});
	};

	$scope.moveSingle = function() {
		var pastePath = $scope.pathsHistory[$scope.pathsHistory.length - 1] + '/' + $scope.pasteFolderName;
		fm.moveSingle({
			pathFrom: $scope.itemToCopy,
			pathTo: pastePath,
			autorename: true,
			callback: function(data) {
				$scope.itemToCopy = '';	
				$scope.refresh();
			}
		});
	};

	$scope.createFolder = function() {
		var createPath = $scope.pathsHistory[$scope.pathsHistory.length - 1] + '/' + $scope.createFolderName;
		fm.createFolder({
			path: createPath,
			callback: function(data) {
				$scope.refresh();
				$('#new_folder_modal').modal('hide');
			},
			error: function(error) {
				console.log(error);
			}
		});
	};

	$scope.getCurrentUser = function() {
		fm.getCurrentUser({
			callback: function(data) {
				$scope.currentUser = data;
				$scope.$apply();
			}
		});
	};

	$scope.getThumbnail = function(path) {
		path = path.charAt(0) == '/' ? path : '/' + path;
		fm.getThumbnail({
			path: path, 
			format: 'png', 
			size: 'w128h128',
			callback: function(data) {
				$scope.thumbnail = window.URL.createObjectURL(data.fileBlob);
				$scope.$apply();
			}
		});

		$scope.$apply(); 
	};

	$scope.getFileMetadata = function(path) {
		$scope.tempLink = '';

		fm.getMetaData({
			path: path,
			callback: function(data) {
			$scope.metaData = data;
			$scope.type = Object.values($scope.metaData)[0];

			if ($scope.type == 'file' &&  $scope.isImage(path)) {
				$scope.getThumbnail(path);
			} else if ($scope.type == 'file' &&  $scope.isPreviewed(path)) {
				$scope.thumbnail = '/assets/img/Docs-icon.png';
			} else {
				$scope.thumbnail = '/assets/img/Folder-icon.png';
			}

				$scope.$apply();
			}
		});
	};

	$scope.isImage = function(path) {
		for ( var k in $scope.supported.images){
			if (path.indexOf($scope.supported.images[k]) > -1) {
				return true;
			}
		}

		return false;
	};

	$scope.isPreviewed = function(path) {

		for ( var k in $scope.supported.previews) {
			if (path.indexOf($scope.supported.previews[k]) > -1) {
				return true;
			}
		}

		return false;
	};

	$scope.getTempLink = function(path) {
		fm.getTempFileLink({
			path: path, 
			callback: function(data) {
				$scope.tempLink = data.link;
				$scope.$apply();
			}
		});
	};

	$scope.editName = function() {
		$scope.isNameEdit = true;
		$scope.oldName = $scope.metaData.name;
	};

	$scope.cancelName = function() {
		$scope.metaData.name = $scope.oldName;
		$scope.oldName = '';
		$scope.isNameEdit = false;
	};

	$scope.rename = function() {
		var path = $scope.metaData.path_display == 'root' ? '' : $scope.metaData.path_display;
		fm.changeName({
			path: path, 
			newName: $scope.metaData.name, 
			autorename: true, 
			callback: function(data) {
				$scope.refresh();
				$scope.oldName = '';
				$scope.isNameEdit = false;
			},
			error: function(error) {
				console.log(error);
			}
		});
	};

	$('#file-input').change(function() {
		var fileInput = document.getElementById('file-input');
		var file = fileInput.files[0];
		if (file) {
			var newName = $scope.pathsHistory[$scope.pathsHistory.length - 1] + '/' + file.name;
			fm.uploadFile({
				file: file, 
				path: newName, 
				callback: function(data) {
					$scope.refresh();
				},
				error: function(error) {
					console.log(error);
				}
			});
		}
	});
});