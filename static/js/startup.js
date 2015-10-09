pimcore.registerNS("pimcore.plugin.folderclassmappings");

pimcore.plugin.folderclassmappings = Class.create(pimcore.plugin.admin, {
    getClassName: function() {
        return "pimcore.plugin.folderclassmappings";
    },

    initialize: function() {
        pimcore.plugin.broker.registerPlugin(this);
        
        Ext.Ajax.request({ 
            url: "/plugin/FolderClassMappings/index/get-folder-class-map",
            success: function (response) {
            	var res = Ext.decode(response.responseText);
            	if(res.success) {
            		folderClassMapArray = res.folderClassMapArray;
            	}
            }.bind(this)
        });
    },
 
    pimcoreReady: function (params,broker){
    	element = Ext.getCmp("pimcore_panel_tree_objects");
    	element.loader.baseAttrs.listeners.contextmenu = this.onTreeNodeContextmenu;
    },
    
    onTreeNodeContextmenu: function () {
        this.select();

        var menu = new Ext.menu.Menu();

        /**
         * case-insensitive string comparison
         * @param f_string1
         * @param f_string2
         * @returns {number}
         */
        function strcasecmp(f_string1, f_string2) {
            var string1 = (f_string1 + '').toLowerCase();
            var string2 = (f_string2 + '').toLowerCase();

            if (string1 > string2) {
                return 1;
            } else if (string1 == string2) {
                return 0;
            }

            return -1;
        }

        /**
         *
         * @param str1
         * @param str2
         * @returns {number}
         */
        function getEqual(str1, str2) {
            var count = 0;
            for (var c = 0; c < str1.length; c++) {
                if (strcasecmp(str1[c], str2[c]) !== 0)
                    break;

                count++;
            }

            if(count > 0) {
                lastSpace = str1.search(/ [^ ]*$/);

                if((lastSpace > 0) && (lastSpace < count)) {
                    count = lastSpace;
                }
            }


            if (str1[count] == " " || (typeof str1[count] == 'undefined')) {
                return count;
            } else {
                return 0;
            }
        };

        var matchCount = 3;
        var classGroups = {};
        var currentClass = '', nextClass = '', count = 0, group = '', lastGroup = '';
        var classNameArr = []; // variable added by rohit for MCP-18
        var object_types = pimcore.globalmanager.get("object_types_store");
        for (var i = 0; i < object_types.getCount(); i++) {
            //
            currentClass = object_types.getAt(i);
            nextClass = object_types.getAt(i + 1);

            // check last group
            count = getEqual(lastGroup, currentClass.get("translatedText"));
            if (count <= matchCount) {
                // check new class to group with
                if (!nextClass) {
                    // this is the last class
                    count = currentClass.get("translatedText").length;
                }
                else {
                    // check next class to group with
                    count = getEqual(currentClass.get("translatedText"), nextClass.get("translatedText"));
                    if (count <= matchCount) {
                        // match is to low, use the complete name
                        count = currentClass.get("translatedText").length;
                    }
                }

                group = currentClass.get("translatedText").substring(0, count);
            }
            else {
                // use previous group
                group = lastGroup;
            }


            // add class to group
            if (!classGroups[ group ]) {
                classGroups[ group ] = [];
            }
            classGroups[ group ].push(currentClass);
            // below two lines added by rohit for find all classes exists in system for MCP-18
            var className = currentClass.get('text');
            classNameArr.push(className);
            // below two lines added by rohit for find all classes exists in system for MCP-18
            lastGroup = group;
        }
        ;


        var objectMenu = {
            objects: [],
            importer: [],
            ref: this
        };
        var tmpMenuEntry;
        var tmpMenuEntryImport;
        var record, tmp;

        /** MCP-18: Add folowing Code by rohit for fetch allowed class for any folder **/
        var arr = []; 
        for(var i =0; i<folderClassMapArray.length;i++) {
        	var path = this.attributes.path;
        	var mapName = folderClassMapArray[i].name;
        	if(!mapName || mapName == null) continue;
        	mapName = mapName.trim();
        	var mapDesc = folderClassMapArray[i].description;
        	var parentPath = path.split('/');
        	var newPath = '';
        	for(var j=1;j<parentPath.length;j++) {
        		newPath = newPath+'/'+parentPath[j];
        		if(newPath == mapName.toLowerCase()) {
            		mapDesc = mapDesc.split(',');
            		if(mapDesc.length > 1) {
            			for(var j=0; j<mapDesc.length; j++) {
            				if(!empty(mapDesc[j].trim()) && in_array(mapDesc[j].trim(), classNameArr)) {
            					arr.push(mapDesc[j].trim());
            				}
            			}
            		} else {
            			if(!empty(mapDesc[0].trim()) && in_array(mapDesc[0].trim(), classNameArr)) {
            				arr.push(mapDesc[0].trim());
            			}
            		}
            		break;
            	}
        	}
        }
        /** MCP-18: Add above Code by rohit for fetch allowed class for any folder **/
        for (var groupName in classGroups) {
        	/** MCP-18: Add folowing Code by rohit for override allowed class and delete extra classes from folders **/
        	this.attributes.reference.config.allowedClasses = arr; 
        	var classArr = [];
        	var classExistsInArr = false;
    		for (var i=0; i<classGroups[groupName].length; i++) {
    			classArr.push(classGroups[groupName][i].get("text"));
    			if(in_array(classGroups[groupName][i].get("text"), arr)) {
    				classExistsInArr = true;
    			}
    		}
    		if(classArr.length>1 && classExistsInArr) {
    			var classGrpArr = classGroups[groupName];
    			var k = 0;
        		for (var i=0; i<classGroups[groupName].length; i++) {
        			if(classGrpArr[k]!=undefined && !in_array(classGrpArr[k].get("text"), arr)) {
        				if(classGrpArr[k+1]!=undefined) {
        					var j=k;
        					for(j=k; j<classGroups[groupName].length-1; j++) {
        						classGrpArr[j] = classGrpArr[j+1];
        					}
        					delete classGrpArr[j];
        				} else {
        					delete classGrpArr[k];
        					break;
        				}
        			} else {
        				k++;
        			}
        		}
        		classGroups[groupName] = classGrpArr;
    		}
    		/** MCP-18: Add above Code by rohit for override allowed class and delete extra classes from folders **/
    		if (classGroups[groupName].length > 1 && classGroups[groupName][1]!=undefined) { // Undefined condition added check by rohit
    			/** MCP-18: Add folowing Code by rohit for remove extra blank folders **/
        		var classExistsFlag = false;
        		for (var i=0; i<classGroups[groupName].length; i++) {
        			if(classGroups[groupName][i]!=undefined && in_array(classGroups[groupName][i].get("text"), arr)) {
        				classExistsFlag = true;
        			}
        		}
        		if(classExistsFlag) {
        		/** MCP-18: Add above Code by rohit for remove extra blank folders **/
                // handle group
	                tmpMenuEntry = {
	                    text: groupName,
	                    iconCls: "pimcore_icon_folder",
	                    hideOnClick: false,
	                    menu: {
	                        items: []
	                    }
	                };
	                tmpMenuEntryImport = {
	                    text: groupName,
	                    iconCls: "pimcore_icon_folder",
	                    handler: this.attributes.reference.importObjects.bind(this, classGroups[groupName][0].get("id"), classGroups[groupName][0].get("text")),
	                    menu: {
	                        items: []
	                    }
	                };
	
	                // add items
	                //  MCP-18: add undefined condition in for loop by rohit
	                for (var i = 0; (i < classGroups[groupName].length && classGroups[groupName][i]!=undefined); i++) {
	                    record = classGroups[groupName][i];
	                    //MCP-18: change id to text in following condition by rohit
	                    if (this.attributes.reference.config.allowedClasses == "all" || in_array(record.get("text"), 
	                        this.attributes.reference.config.allowedClasses)) {
	
	                        /* == menu entry: create new object == */
	
	                        // create menu item
	                        tmp = {
	                            text: record.get("translatedText"),
	                            iconCls: "pimcore_icon_object_add",
	                            handler: this.attributes.reference.addObject.bind(this, record.get("id"), record.get("text"))
	                        };
	
	                        // add special icon
	                        if (record.get("icon")) {
	                            tmp.icon = record.get("icon");
	                            tmp.iconCls = "";
	                        }
	
	                        tmpMenuEntry.menu.items.push(tmp);
	
	
	                        /* == menu entry: import object == */
	
	                        // create menu item
	                        tmp = {
	                            text: record.get("translatedText"),
	                            iconCls: "pimcore_icon_object_import",
	                            handler: this.attributes.reference.importObjects.bind(this, record.get("id"), record.get("text"))
	                        };
	
	                        // add special icon
	                        if (record.get("icon")) {
	                            tmp.icon = record.get("icon");
	                            tmp.iconCls = "";
	                        }
	
	                        tmpMenuEntryImport.menu.items.push(tmp);
	                    }
	                }
	
	                objectMenu.objects.push(tmpMenuEntry);
	                objectMenu.importer.push(tmpMenuEntryImport);
        		}

            }
            else {
                record = classGroups[groupName][0];
                if (this.attributes.reference.config.allowedClasses == "all" || in_array(record.get("text"), 
                    this.attributes.reference.config.allowedClasses)) {

                    /* == menu entry: create new object == */
                    tmpMenuEntry = {
                        text: record.get("translatedText"),
                        iconCls: "pimcore_icon_object_add",
                        handler: this.attributes.reference.addObject.bind(this, record.get("id"), record.get("text"))
                    };

                    if (record.get("icon")) {
                        tmpMenuEntry.icon = record.get("icon");
                        tmpMenuEntry.iconCls = "";
                    }

                    objectMenu.objects.push(tmpMenuEntry);


                    /* == menu entry: import object == */
                    tmpMenuEntryImport = {
                        text: record.get("translatedText"),
                        iconCls: "pimcore_icon_object_import",
                        handler: this.attributes.reference.importObjects.bind(this, record.get("id"), record.get("text"))
                    };

                    if (record.get("icon")) {
                        tmpMenuEntryImport.icon = record.get("icon");
                        tmpMenuEntryImport.iconCls = "";
                    }

                    objectMenu.importer.push(tmpMenuEntryImport);
                }
            }
        };
        

        var isVariant = this.attributes.type == "variant";

        if (this.attributes.permissions.create) {
            if (!isVariant) {
                //MCP-18: add condition if no allowed class to create object
                if (this.attributes.reference.config.allowedClasses == "all" || this.attributes.reference.config.allowedClasses.length > 0) {
            	    menu.add(new Ext.menu.Item({
	                    text: t('add_object'),
	                    iconCls: "pimcore_icon_object_add",
	                    hideOnClick: false,
	                    menu: objectMenu.objects
	                }));
                }
            }

            if (this.attributes.allowVariants) {
                menu.add(new Ext.menu.Item({
                    text: t("add_variant"),
                    iconCls: "pimcore_icon_tree_variant",
                    handler: this.attributes.reference.createVariant.bind(this)
                }));
            }

            if (!isVariant) {

                if (this.attributes.type == "folder") {
                    menu.add(new Ext.menu.Item({
                        text: t('add_folder'),
                        iconCls: "pimcore_icon_folder_add",
                        handler: this.attributes.reference.addFolder.bind(this)
                    }));
                }
           
            	//MCP-18: add condition if no allowed class to create object
                if (this.attributes.reference.config.allowedClasses == "all" || this.attributes.reference.config.allowedClasses.length > 0) {
	                menu.add({
	                    text: t('import_csv'),
	                    hideOnClick: false,
	                    iconCls: "pimcore_icon_object_csv_import",
	                    menu: objectMenu.importer
	                });
                }

                //paste
                var pasteMenu = [];

                if (this.attributes.reference.cacheObjectId && this.attributes.permissions.create) {
                    pasteMenu.push({
                        text: t("paste_recursive_as_childs"),
                        iconCls: "pimcore_icon_paste",
                        handler: this.attributes.reference.pasteInfo.bind(this, "recursive")
                    });
                    pasteMenu.push({
                        text: t("paste_recursive_updating_references"),
                        iconCls: "pimcore_icon_paste",
                        handler: this.attributes.reference.pasteInfo.bind(this, "recursive-update-references")
                    });
                    pasteMenu.push({
                        text: t("paste_as_child"),
                        iconCls: "pimcore_icon_paste",
                        handler: this.attributes.reference.pasteInfo.bind(this, "child")
                    });


                    if (this.attributes.type != "folder") {
                        pasteMenu.push({
                            text: t("paste_contents"),
                            iconCls: "pimcore_icon_paste",
                            handler: this.attributes.reference.pasteInfo.bind(this, "replace")
                        });
                    }
                }
            }

            if (!isVariant) {
                if (this.attributes.reference.cutObject && this.attributes.permissions.create) {
                    pasteMenu.push({
                        text: t("paste_cut_element"),
                        iconCls: "pimcore_icon_paste",
                        handler: function () {
                            this.attributes.reference.pasteCutObject(this.attributes.reference.cutObject,
                                this.attributes.reference.cutParentNode, this, this.attributes.reference.tree);
                            this.attributes.reference.cutParentNode = null;
                            this.attributes.reference.cutObject = null;
                        }.bind(this)
                    });
                }

                if (pasteMenu.length > 0) {
                    menu.add(new Ext.menu.Item({
                        text: t('paste'),
                        iconCls: "pimcore_icon_paste",
                        hideOnClick: false,
                        menu: pasteMenu
                    }));
                }
            }
        }
                
        if (!isVariant) {
        	//copy
        	if (this.id != 1 && this.attributes.permissions.view) {
                menu.add(new Ext.menu.Item({
                    text: t('copy'),
                    iconCls: "pimcore_icon_copy",
                    handler: this.attributes.reference.copy.bind(this)
                }));
            }
        	
            //cut
            if (this.id != 1 && !this.attributes.locked && this.attributes.permissions.rename) {
                menu.add(new Ext.menu.Item({
                    text: t('cut'),
                    iconCls: "pimcore_icon_cut",
                    handler: this.attributes.reference.cut.bind(this)
                }));
            }
        }

        //publish
        if (this.attributes.type != "folder" && !this.attributes.locked) {
            if (this.attributes.published && this.attributes.permissions.unpublish) {
                menu.add(new Ext.menu.Item({
                    text: t('unpublish'),
                    iconCls: "pimcore_icon_tree_unpublish",
                    handler: this.attributes.reference.publishObject.bind(this, this.attributes.id, 'unpublish')
                }));
            } else if (!this.attributes.published && this.attributes.permissions.publish) {
                menu.add(new Ext.menu.Item({
                    text: t('publish'),
                    iconCls: "pimcore_icon_tree_publish",
                    handler: this.attributes.reference.publishObject.bind(this, this.attributes.id, 'publish')
                }));
            }
        }


        if (this.attributes.permissions["delete"] && this.id != 1 && !this.attributes.locked) {
            menu.add(new Ext.menu.Item({
                text: t('delete'),
                iconCls: "pimcore_icon_delete",
                handler: this.attributes.reference.remove.bind(this)
            }));
        }

        if (this.attributes.permissions.create) {
            menu.add(new Ext.menu.Item({
                text: t('search_and_move'),
                iconCls: "pimcore_icon_search_and_move",
                handler: this.attributes.reference.searchAndMove.bind(this, this.id)
            }));
        }

        if (this.attributes.permissions.rename && this.id != 1 && !this.attributes.locked) {
            menu.add(new Ext.menu.Item({
                text: t('rename'),
                iconCls: "pimcore_icon_edit_key",
                handler: this.attributes.reference.editKey.bind(this)
            }));
        }


        if (this.id != 1) {
            var user = pimcore.globalmanager.get("user");
            if (user.admin) { // only admins are allowed to change locks in frontend

                var lockMenu = [];
                if (this.attributes.lockOwner) { // add unlock
                    lockMenu.push({
                        text: t('unlock'),
                        iconCls: "pimcore_icon_lock_delete",
                        handler: function () {
                            this.attributes.reference.updateObject(this.attributes.id, {locked: null}, function () {
                                this.attributes.reference.tree.getRootNode().reload();
                            }.bind(this));
                        }.bind(this)
                    });
                } else {
                    lockMenu.push({
                        text: t('lock'),
                        iconCls: "pimcore_icon_lock_add",
                        handler: function () {
                            this.attributes.reference.updateObject(this.attributes.id, {locked: "self"}, function () {
                                this.attributes.reference.tree.getRootNode().reload();
                            }.bind(this));
                        }.bind(this)
                    });

                    lockMenu.push({
                        text: t('lock_and_propagate_to_childs'),
                        iconCls: "pimcore_icon_lock_add_propagate",
                        handler: function () {
                            this.attributes.reference.updateObject(this.attributes.id, {locked: "propagate"},
                                function () {
                                    this.attributes.reference.tree.getRootNode().reload();
                                }.bind(this));
                        }.bind(this)
                    });
                }

                if(this.attributes["locked"]) {
                    // add unlock and propagate to children functionality
                    lockMenu.push({
                        text: t('unlock_and_propagate_to_children'),
                        iconCls: "pimcore_icon_lock_delete",
                        handler: function () {
                            Ext.Ajax.request({
                                url: "/admin/element/unlock-propagate",
                                params: {
                                    id: this.id,
                                    type: "object"
                                },
                                success: function () {
                                    this.parentNode.reload();
                                }.bind(this)
                            });
                        }.bind(this)
                    });
                }

                menu.add(new Ext.menu.Item({
                    text: t('lock'),
                    iconCls: "pimcore_icon_lock",
                    hideOnClick: false,
                    menu: lockMenu
                }));
            }
        }


        if (this.reload) {
            menu.add(new Ext.menu.Item({
                text: t('refresh'),
                iconCls: "pimcore_icon_reload",
                handler: this.reload.bind(this)
            }));
        }

        menu.show(this.ui.getAnchor());
        this.attributes.reference.config.allowedClasses = "all"; 
    }
});

var folderclassmappingsPlugin = new pimcore.plugin.folderclassmappings();

