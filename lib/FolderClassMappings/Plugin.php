<?php
namespace FolderClassMappings;

use Pimcore\API\Plugin as PluginLib;

class Plugin extends PluginLib\AbstractPlugin implements PluginLib\PluginInterface
{
    public function init()
    {}

    public static function install()
    {
        $path = self::getInstallPath();
        
        if (! is_dir($path)) {
            mkdir($path);
        }
        
        if (self::isInstalled()) {
            $install = new Plugin\Install();
            $install->configureExistingClasses();
            return "Plugin successfully installed.";
        } else {
            return "Plugin could not be installed";
        }
    }

    public static function uninstall()
    {
        rmdir(self::getInstallPath());
        
        if (! self::isInstalled()) {
            return "Plugin successfully uninstalled.";
        } else {
            return "Plugin could not be uninstalled";
        }
    }

    public static function getInstallPath()
    {
        return PIMCORE_PLUGINS_PATH . "/FolderClassMappings/install";
    }

    public static function isInstalled()
    {
        return is_dir(self::getInstallPath());
    }
}
