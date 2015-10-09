<?php
namespace FolderClassMappings\Plugin;

use Pimcore\Model\Object;
class Install
{
    public function configureExistingClasses()
    {        
        $this->removeConfiguration();  
                   
        $keyconfig = new Object\KeyValue\KeyConfig();
        $keyconfig->setName('FolderClassMapping');
        $keyconfig->setType("select");        
        
        $db = \Pimcore\Resource\Mysql::get();
        $data = $db->fetchAll('SELECT name FROM classes');
        $options = array();
        foreach ($data as $cls){            
            array_push($options, array("key" => $cls['name'], "value" => "")); 
        }
        
        $keyconfig ->setPossibleValues(json_encode($options));
        $keyconfig ->save();        
        return true;
    }

    private function removeConfiguration(){
        $keyconfig = Object\KeyValue\KeyConfig::getByName('FolderClassMapping');
        if($keyconfig instanceof Object\KeyValue\KeyConfig){
            $keyconfig ->delete();
        }        
    }
}
