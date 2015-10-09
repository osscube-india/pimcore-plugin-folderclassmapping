<?php
class FolderClassMappings_IndexController extends \Pimcore\Controller\Action\Admin
{

    /**
     * function to fetch all keys and values of key group Folder class map
     *
     * @author Prateek Suhane
     * @return Json
     */
    public function getFolderClassMapAction()
    {        
        $keyArray = $this->fetchMapping('FolderClassMapping');
        $this->_helper->json(array(
            "success" => true,
            'folderClassMapArray' => $keyArray
        ));
    }
    
    /**
     * function to fetch mappings on the basis of key
     *
     * @author Prateek Suhane
     * @return array
     */
    public function fetchMapping($keyName)
    {
        $keyconfig = \Pimcore\Model\Object\KeyValue\KeyConfig::getByName($keyName);
        $keyArray = array();
        if($keyconfig instanceof \Pimcore\Model\Object\KeyValue\KeyConfig && !empty($keyconfig->getPossibleValues())) {
            $obj = json_decode($keyconfig->getPossibleValues());
            if (count($obj) > 0) {
                $i = 0;
                foreach ($obj as $val) {
                    $keyArray[$i]['name'] = $val->value;
                    $keyArray[$i]['description'] = $val->key;
                    $i++;
                }
            }
        }
        
        return $keyArray;        
    }       
}
