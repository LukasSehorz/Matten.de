<?php

class Artikel extends DbObject implements Serializable, ArtikelInterface, TextInterface, Steuerprodukt{
    protected static $tablename = 'artikel';
    protected static $keynames = array('id');
    protected static $auto_key = 'id';
    
    public static $textfelder = array('titel', 'text', 'alternativtext_bild1', 'meta_title','meta_keywords', 'meta_description'); // Darf folgende Zeichen nicht enthalten: [:]
    public $attribute = null;
    public $colors = null;
    public $features = null;
    // protected $data = array('id' => 0, 'urlkey'=>'', 'artikelnummer'=> '', '');
    
    /**
     * referenz auf das Shopobjekt
     *
     * @var MeltingShop
     */
    protected $shop;
    
    protected $kategorie = null; // Cache für kategorie-Objekt (Hauptkategorie)
    protected $artikel_gruppe_id = null;
    protected $artikel_gruppe = null;
    protected $zubehoer = null;
    
    protected $spezialoption = null;
    
    /*
     * Komponenten
     */
    
    /**
     * @var TextComponent
     */
    public $text = null;
    
    /**
     * @var ArtikelDealsComponent
     */
    public $deal = null;
    
    /**
     * @var ArtikelPreisstaffelComponent
     */
    public $preisstaffel = null;
    
    function __construct($keys = null){
        $this->shop = MM::shop();
        parent::__construct($keys);
        $this->text = new ArtikelTextComponent($this);
        
        if($this->shop->isPluginLoaded('Deals')){
        	$this->deal = new ArtikelDealsComponent($this);
        }
		if($this->shop->isPluginLoaded('Preisstaffeln')){
        	$this->preisstaffel = new ArtikelPreisstaffelComponent($this);
        }
    }
    
    /**
     * Gibt immer 1 zurück
     * 
     * @see Steuerprodukt::getAnzahl()
     */
    public function getAnzahl(){
    	return 1;
    }
    
    public function getNettoPreis(){
    	return $this->getPreis();
    }

    /**
     * Gibt die Attribute des Artikels zurück und läd sie erst bei Bedarf
     * 
     * 
     */
    public function getColors(){
        if($this->colors === null){
            $this->colors = ArtikelAttribut::getColorsForArtikel($this->getId());
        }    
        return $this->colors;
    }
    
    
    /**
     * Gibt die Attribute des Artikels zurück und läd sie erst bei Bedarf
     * 
     * 
     */
    public function getAttribute(){
        if($this->attribute === null){
            $this->attribute = ArtikelAttribut::getForArtikel($this->getId());
        }    
        return $this->attribute;
    }
    /**
     * Setzt die gecachten Attribute
     *
     *
     */
    public function setCacheAttribute($attribute=array()){
    	$this->attribute = $attribute;
    }
    
    public function hasAttribute(){
    	$this->getAttribute();
    	return $this->attribute !== null;
    }
    
    public function selectAttribut($attribute_code, $wert){
        try{
            return $this->getAttribut($attribute_code)->selectWert($wert);
        } catch (Exception $e){
            return false;
        }
    }
    
    public function isPreisFest(){
    	return $this->get('fester_preis') != 'nein';
    } 
    
    /**
     * 
     * @param string $code
     * 
     * @return ArtikelAttribut
     */
    public function getAttribut($code){
        if($this->attribute === null)
            $this->getAttribute();
        if(array_key_exists($code, $this->attribute))
            return $this->attribute[$code];
        throw new Exception("Attribut $code in Artikel {$this->getId()} nicht gefunden!", MeltingShop::E_OBJECTNOTFOUND);
    }
    
    public function hasAttribut($code){
        if($this->attribute === null)
            $this->getAttribute();
        if(array_key_exists($code, $this->attribute))
            return true;    
        return false;
    }
    
    
    public function serialize() {
    	$e = new \Exception(); // verhindert triggern von Serialize-Bug in PHP 5.6... dont ask!
        $this_data = array();
        $this_data['data'] = $this->data;
        $this_data['attribute'] = $this->getAttribute();
        $text = clone($this->text);
        $text->setContainer(null);
        $this_data['texte'] = $text;
        return serialize($this_data);
    }
    
    public function unserialize($data) {
        $this->__construct();
        $this_data = unserialize($data);
        $this->data = $this_data['data'];
        $this->attribute = $this_data['attribute'];
        if(isset($this_data['texte']) AND $this_data['texte'] instanceof TextComponent){
        	$this->text = $this_data['texte'];
        	$this->text->setContainer($this);
        }
    }
    
    public function setBestellKommentar($kommentar){
    	$this->set('bestell_kommentar', (string) $kommentar);
    }
    
    public function getBestellKommentar(){
    	return $this->get('bestell_kommentar');
    }
    
    /********************************************************************************************************************
     * Texte
     */
    
    public function getTextFields(){
    	return $this->text->getTextFields();
    }
    
    public function getHtml($code, $sprache=null){
    	return $this->getReplacedText($code, $sprache);
    }
    
    public function getReplacedText($code, Sprache $sprache=null){
    	return $this->replace($this->getText($code, $sprache));
    }
    
    public function replace($text){
    	if(!is_string($text));
    	$text = (string) $text;
    	//echo $text;
    	$text_rep = preg_replace_callback('/{{([^}]*):([^}]*)(:([^}]*)){0,1}}}/U', array($this,"textreplace"), $text);
    	if($text_rep !== false)
    		return $text_rep;
    		return $text;
    }
    
    protected function textreplace($matches){
    	if(!array_key_exists(4,$matches))
    		$matches[4] = null;
    		return $this->getDataSourceValue($matches[1], $matches[2], $matches[4]);
    }
    
    protected function getDataSourceValue($src_code, $val_code, $val_code2, $default=false){
    	switch($src_code){
    		case 'block':
    			return MM::shop()->getPlugin('InfoCMS')->getBlockHtml($val_code);
    		case 'template':
    			ob_start();
    			MM::shop()->getNavigation()->getCurrentPage()->getTemplate()->getOptionTemplate($val_code, $val_code2);
    			return ob_get_clean();
    		case 'stammdaten':
    			return MM::shop()->getPlugin('Stammdaten')->get($val_code);
    		case 'artikel':
    			return MM::shop()->getPlugin('Katalog')->getArtikelById((int) $val_code)->getFieldText($val_code2);
    	}
    	return $default;
    }
    
    public function getText($code, Sprache $sprache=null, $default=false){
    	return $this->text->getText($code, $sprache, $default);
    }
    
    
    public function getName(Sprache $sprache=null){
    	return $this->text->getName($sprache);
    }
    
	/**
     * Gibt eine auf $len zeichen gekürzte Version des Textes zurück
     * 
     * @param string $code
     * @param int $len
     * @param mixed $sprache
     * @return string
     */
    public function getShortenedText($code, $len=100, $sprache=null){
    	return $this->text->getShortenedText($code,$len, $sprache);
    }
    
    /**
     * Speichert einen Text
     * @param Sprache $lang
     * @param string $code
     * @param string $value
     */
    public function setText(Sprache $lang, $code, $value){
    	return $this->text->setText($lang, $code, $value);
    }
    
    
    
	protected function getFieldInput($field){
	    $shop = MM::shop();
	    
	    $disabled = MM::conf('katalog_artikel_disabled_fields',null,array());
	    if(array_search($field, $disabled) !== false){
	        return false;
	    }
	    
		switch($field){
			case 'id':
				return "<input type='hidden' name='{$this->table()}[{$field}]' value='{$this->get($field)}' />";
			case 'import_marker':
				return false;
			case 'verfuegbarkeit':
				$ret = "<select name='{$this->table()}[{$field}]'>".
				    option_tag(0, $this->get($field), $shop->text('verfuegbarkeits_text_0')).
				    option_tag(1, $this->get($field), $shop->text('verfuegbarkeits_text_1')).
				    option_tag(2, $this->get($field), $shop->text('verfuegbarkeits_text_2')).
				    option_tag(3, $this->get($field), $shop->text('verfuegbarkeits_text_3')).
				    "</select>";
				return $ret;
			case 'link_artikel_id':
				$ret = "<select name='{$this->table()}[{$field}]'>
					<option value='0'>keins</option>";
				foreach(Artikel::getAll() as $artikel) /*@var $artikel Artikel */
				    $ret .= option_tag($artikel->getId(), $this->get($field), $artikel->getText('titel'));
			    $ret .= "</select>";
				return $ret;
			case 'versandklassen_id':
				return FormFieldHandler::getObjectSelect($this, $field, Versandklasse::getAll(), 'id', 'name');
			case 'versandzusatz_id':
				return FormFieldHandler::getObjectSelect($this, $field, Versandzusatz::getAll(), 'id', 'name');
			case 'steuerklassen_id':
				return FormFieldHandler::getObjectSelect($this, $field, Steuerklasse::getAll(), 'id', 'name');
			case 'urlkey':
		        return "<input type='text' name='{$this->table()}[{$field}]' value='{$this->get($field)}' size='40' onkeypress='return restrictCharacters(this, event, /^[a-zA-Z0-9_-]*$/g);' />";
			case 'preis':
			case 'sonderpreis':
				$faktor  = ($this->getSteuerRate()+100)/100;
				$netto = MM::shop()->text('netto');
				$brutto = MM::shop()->text('brutto');
				return "<div>".FormFieldHandler::getDecimalInput($this, $field, 10, "data-linkedfactor='".$faktor."'")." € $netto = ".'<input size="10" class="factorlinked" value="'.number_format($this->get($field) * $faktor,2,'.','').'" />'." € $brutto</div>";
			case 'lieferanten_preis':
				$steuer_id = (int) $this->getLieferantenSteuerklassenId();
				$faktor  = ($this->getSteuerRate($steuer_id)+100)/100;
		        $netto = MM::shop()->text('netto');
		        $brutto = MM::shop()->text('brutto');
		        return "<div>".FormFieldHandler::getDecimalInput($this, $field, 10, "data-linkedfactor='".$faktor."'")." € $netto = ".'<input size="10" class="factorlinked" value="'.number_format($this->get($field) * $faktor,2,'.','').'" />'." € $brutto</div>";
	        case 'kategorie_id':
				$ret = "<select name='{$this->table()}[{$field}]'>
					<option value='0'>keine</option>";
				foreach(Kategorie::getAll() as $kategorie)
				    $ret .= option_tag($kategorie->getid(), $this->get($field), $kategorie->getName());
			    $ret .= "</select>";
				return $ret;
			case 'kategorien_id':
		    case 'spezialoption_data':
			    return false;
            case 'spezialoption':
                $ret = $this->getEnumInput($field);
                $ret .= "<div id='spezialoption_form'>";
                try{
                    $ret .= $this->hasSpezialoption()?$this->getSpezialoption()->getAdminForm():'';
                } catch (Exception $e){
                    $ret .= $e->getMessage();
                }
                $ret .= "</div>";
                return $ret;
		    case 'startseite':
            case 'versandkosten':
	            return $this->getEnumInput($field);
			case 'hersteller_id':
				if(!MM::shop()->isPluginLoaded('KatalogHersteller')){
					return FormFieldHandler::getTextInput($this, $field);
				}
				$ret = "<select name='{$this->table()}[{$field}]'>
					<option value='0'>keiner</option>";
				foreach(Hersteller::getAll() as $item)
				    $ret .= option_tag($item->getid(), $this->get($field), $item->getName());
			    $ret .= "</select>";
				return $ret;
			case 'status':
				$ret = "<select name='{$this->table()}[{$field}]'>";
				$ret .= option_tag('aktiviert', $this->get($field) , 'Aktiviert');
				$ret .= option_tag('deaktiviert', $this->get($field) , 'Deaktiviert');
				$ret .= "</select>";
				return $ret;
		}
		return parent::getFieldInput($field);
    } 
    
    public function getFieldLabel($field){
    	switch($field){
    		case 'id':
   				return "ID";
			case 'link_artikel_id':
		        return 'Verknüpftes Produkt';
    		case 'kategorie_id':
   				return "Kategorie";
    		case 'versandklassen_id':
    		    return "Versandklasse";
    		case 'steuerklassen_id':
    		    return "Steuerklasse";
		    case 'hersteller_id':
                return 'Hersteller';
    		case 'urlkey':
		        return 'Url-Schlüssel';
	        case 'zubehoer':
	            return "Zubehör (Art.Nr.)";
	        case 'weight':
	            return "Gewicht";
  			default:
    			return ucwords($field);
    	}
    }
    
    
    /**
     * Gibt ein array mit allen Artikeln zurück
     * 
     * @param $sql_add zusätzliche SQL-Bedingung
     * @return array of Bild
     */
    public static function getAll($sql_add='ORDER BY artikelnummer ASC'){
        return self::_getAll(__CLASS__, 'artikel', array('artikel.id'), MeltingShop::$db, $sql_add);
    }
    
    public static $most_angesehen = null;
    
    public static function getMostAngesehen(){
        if(self::$most_angesehen === null){
            $artikels = self::getAll("ORDER BY angesehen DESC LIMIT 0,1");
            if(!empty($artikels))
                self::$most_angesehen = reset($artikels);
        }
        if(! self::$most_angesehen instanceof Artikel)
            throw new Exception("Artikel nicht gefunden!", MeltingShop::E_OBJECTNOTFOUND);
        return self::$most_angesehen;
    }
    
    /**
     * Gibt die Produkte die für die Startseite markiert sind zurück.
     * @param int $limit
     * @return array of Artikel
     */
    public static function getAllStartseite($limit=6){
        $limit = (int) $limit;
        return self::getAll(" WHERE artikel.startseite='ja' AND artikel.status='aktiviert' ORDER BY RAND() LIMIT 0,$limit");
    }
    
    public static function getCount($sql_add=''){
        return self::_getCount(__CLASS__, 'artikel', array('artikel.id'), MeltingShop::$db, $sql_add);
    }
    
    public static function getByKategorieId($kategorie_id, $sqlwhereadd='', $joinadd='', $orderadd= 'ORDER BY artikelnummer ASC'){
        $kategorie_id = (int) $kategorie_id; 
        return self::getAll("INNER JOIN artikel_kategorien ON (artikel_kategorien.artikel_id=artikel.id) $joinadd WHERE artikel_kategorien.kategorien_id=$kategorie_id AND artikel.status='aktiviert' $sqlwhereadd $orderadd");
        // return self::_getAll(__CLASS__, 'artikel', array('artikel.id'), MeltingShop::$db, "WHERE kategorie_id=$kategorie_id AND artikel.status='aktiviert' ORDER BY artikelnummer ASC");
    }
    
    public static function getCountByKategorieId($kategorie_id, $sqlwhereadd='', $joinadd=''){
        $kategorie_id = (int) $kategorie_id; 
        return self::getCount("INNER JOIN artikel_kategorien ON (artikel_kategorien.artikel_id=artikel.id) $joinadd WHERE artikel_kategorien.kategorien_id=$kategorie_id AND artikel.status='aktiviert' $sqlwhereadd");
        // return self::_getAll(__CLASS__, 'artikel', array('artikel.id'), MeltingShop::$db, "WHERE kategorie_id=$kategorie_id AND artikel.status='aktiviert' ORDER BY artikelnummer ASC");
    }
    
    public static function setImportMarker(){
        $db = MeltingShop::$db;
        $query = "UPDATE artikel SET import_marker = 1";
        $result = mysql_query($query);
        if(!$result)
            throw new Exception("Datenbankfehler: ".mysql_error($db), MeltingShop::E_DATABASEERROR);
    }

    /**
     * verknüpft alle Produkte mit den Eltern ihrere Kategorien.
     * Führt dies so oft aus bis keine Änderung mehr bewirkt wird.
     */
    public static function copyToParentCategories(){
        $query = "INSERT INTO artikel_kategorien
        
            SELECT t_link.artikel_id, kategorien.parent_id as kategorien_id 
            FROM `artikel_kategorien` AS t_link
            
            LEFT JOIN kategorien ON (t_link.kategorien_id = kategorien.id)
            
            LEFT JOIN `artikel_kategorien` AS p_link ON (p_link.kategorien_id = kategorien.parent_id AND p_link.artikel_id = t_link.artikel_id)
            
            WHERE kategorien.id IS NOT NULL
            AND kategorien.parent_id > 0
            AND p_link.artikel_id IS NULL
            
            GROUP BY t_link.artikel_id, kategorien.parent_id
            ORDER BY t_link.artikel_id ASC";
        do{
            $result = mysql_query($query, MeltingShop::$db);
        } while($result && mysql_affected_rows(MeltingShop::$db) > 0 );
    }
    
    /**
     * Inkrementiert den "angesehen" wert in der Datenbank
     * 
     */
    public function incAngesehen(){
        $query = "UPDATE artikel set angesehen = angesehen+1 WHERE artikel.id={$this->getId()}";
        $result = mysql_query($query, MeltingShop::$db);
        if($result)
            $this->set('angesehen', 1+$this->get('angesehen'));
    }
    
    /* getter wrapper */
    
    /**
     * @return int
     */
    public function getId(){
        return $this->get('id');
    }
    
    /**
     * @return string
     */
    public function getUrlkey(){
        return $this->get('urlkey');
    }
    
    /**
     * @return string
     */
    public function getArtikelnummer(){
        return $this->get('artikelnummer');
    }
    
    /**
     * @return string
     */
    public function getLieferantenArtikelnummer(){
    	return $this->get('lieferanten_artikelnummer');
    }
    
    /**
     * Funktion für Einzelkategorie
     * 
     * @return int
     */
    public function getKategorieId(){
        $id = (int) $this->get('kategorien_id');
        if(!$id){
            $ids = $this->getKategorieIds();
            if(!empty($ids))
                $id = reset($ids);
            else
                $id = 0;
        } 
        return $id;
    }
    
    /**
     * @return int
     */
    public function getVersandklassenId(){
        return (int) $this->get('versandklassen_id');
    }
    
    /**
     * @return int
     */
    public function getVersandzusatzId(){
    	return (int) $this->get('versandzusatz_id');
    }
    
    /**
     * @return bool
     */
    public function isVersandNachGewicht(){
        return $this->get('versandkosten') == 'gewicht';
    }
    
    /**
     * @return bool
     */
    public function isVersandNachPreis(){
    	return $this->get('versandkosten') == 'preis';
    }
    
    /**
     * @return bool
     */
    public function isVersandNachLaenge(){
    	return $this->get('versandkosten') == 'laenge';
    }
    
    /**
     * @return bool
     */
    public function isVersandNachQm(){
    	return $this->get('versandkosten') == 'qm';
    }
    
    /**
     * @return float
     */
    public function getGewicht(){
        $weight = $this->getGewichtOhneOptionen();
        $weight += $this->getOptionenGewicht();
        return $weight;
    }
    
    public function getGewichtOhneOptionen(){
    	return (float) $this->get('weight');
    }
    
    public function getOptionenGewicht(){
    	try{
    		$add_weight = (float) $this->getSpezialoption()->getZusatzGewicht();
    	} catch(Exception $e){
    		$add_weight = 0;
    	}
		return $add_weight;
    }
    
    private $kategorie_ids = array();
    
    /**
     * Funktion für mehrere Kaegorien über Linktabelle
     * 
     * @return int
     */
    public function getKategorieIds($forceload = false){
        if(!empty($this->kategorie_ids) && !$forceload)
            return $this->kategorie_ids;
        $query = "SELECT kategorien_id FROM artikel_kategorien WHERE artikel_id={$this->getId()}";
        $result = mysql_query($query, static::$db);
        while($result && $line=mysql_fetch_assoc($result))
            $this->kategorie_ids[] = $line['kategorien_id'];
        return $this->kategorie_ids;
    }
    
    /**
     * @return array of Features
     */
    public function getFeatures(){
    	if(!MM::shop()->isPluginLoaded('KatalogHersteller')){
    		return array();
    	}
    	 
        if($this->features == null){
            $features = Features::getAll("INNER JOIN artikel_features ON (features.id=artikel_features.features_id) 
            	WHERE artikel_features.artikel_id='{$this->getId()}' AND features.status='aktiviert'");
            foreach($features as $feature){
                $this->features[$feature->getId()] = $feature;
            }
            if(empty($features))
                $this->features = array(); // Warnings etc vermeiden. Leeres Array ist korrekt
        }
        return $this->features;
    }
    
    public function hasFeature($feature){
    	if(!MM::shop()->isPluginLoaded('KatalogHersteller')){
    		return false;
    	}
        
        if($this->features === null)
            $this->getFeatures();
            
        if($feature instanceof Features)
            $feature = $feature->getId();
            
        $feature = (int) $feature;
        return array_key_exists($feature, $this->features);
    }
    
    /**
     * Prüft ob der Artikel eine Spezialoption hat
     * 
     * @return bool
     */
    public function hasSpezialoption(){
        $option = $this->getSpezialoptionCode();
        return  !empty($option);
    }
    
    /**
     * Gibt den Code der Spezialoption zurück
     * 
     * @return string
     */
    public function getSpezialoptionCode(){
        $option = $this->get('spezialoption');
        $option=$option=='keine'?false:$option;
        return $option; 
    }
    
    /**
     * Spezialoption-Beschreibungszeile für Warenkorb etc
     */
    public function getSpezialoptionZeile(Sprache $sprache=null){
        try{
            return $this->getSpezialoption()->getDescriptionText($sprache);
        } catch(Exception $e){
            return false;
        }
    }
    
    public function getSpezialoptionAdminZeile(){
        try{
            return $this->getSpezialoption()->getAdminDescriptionText();
        } catch(Exception $e){
            return false;
        }
    }
    
    
    
    /**
     * Gibt die Spezialoption zu diesem Produkt zurück
     * 
     * @return Spezialoption
     */
    public function getSpezialoption(){
        $code = $this->getSpezialoptionCode();
        $class = 'Spezialoption'.ucwords($code);
        if($this->spezialoption && get_class($this->spezialoption) == $class ){
            return $this->spezialoption;
        } 
        
        $so = null;
        if($this->get('spezialoption_data')){
            $so = unserialize($this->get('spezialoption_data'));
            // var_dump($so);
        }
            
        if($so and get_class($so) == $class){
            $so->setArtikel($this);
        } else {
            $so = new $class($this);
        }
        
        $this->spezialoption = $so;
        return $so;
    }
    
    /**
     * setzt Spezialoption zu diesem Produkt
     *
     * @return Artikel
     */
    public function setSpezialoption(Spezialoption $o){
    	$class = get_class($o);
    	$code = strtolower(substr($class,strlen('Spezialoption')));
    	$this->set('spezialoption', $code);
    	$this->set('spezialoption_data', serialize($o));
    	$o->setArtikel($this);    
    	$this->spezialoption = $o;
    	return $this;
    }
    
    /**
     * setzt Spezialoption zu diesem Produkt
     *
     * @return Artikel
     */
    public function removeSpezialoption(){
    	$this->set('spezialoption', 'keine');
    	$this->set('spezialoption_data', '');
    	$this->spezialoption = null;
    	return $this;
    }
    
    
    
    public function hasKategorieId($id){
        return (array_search($id, $this->getKategorieIds()) === false)?false:true;
    }
    public function hasKategorie(Kategorie $k){
        return $this->hasKategorieId($k->getId());
    }
    
    /**
     * Fügt dem Produkt eine Kategorie per ID hinzu
     *
     * @param int $id
     */
    public function addKategorieId($id){
        if(!$this->getId())
            throw new Exception("Kategorien können nur an gespeicherte Produkte geknüpft werden!", Artikel::E_UNINTIALIZED);
        $id = (int) $id;
        if(!$id)
            throw new Exception("Versuch einer Verknüpfung mit Null-Kategorie", Artikel::E_UNINTIALIZED);
            
        $query = "REPLACE INTO artikel_kategorien SET artikel_id={$this->getId()}, kategorien_id=$id";
        $result = mysql_query($query, static::$db);
        if(!$result)
            throw new Exception("Datenbankfehler: ".mysql_error(static::$db), MeltingShop::E_DATABASEERROR);
        $this->getKategorieIds(true);
    }
    
    /**
     * Fügt dem Produkt ein Feature per ID hinzu
     *
     * @param int $id
     */
    public function addFeatureId($id){
        if(!$this->getId())
            throw new Exception("Features können nur an gespeicherte Produkte geknüpft werden!", Artikel::E_UNINTIALIZED);
        $id = (int) $id;
        if(!$id)
            throw new Exception("Versuch einer Verknüpfung mit Null-Features", Artikel::E_UNINTIALIZED);
            
        $query = "REPLACE INTO artikel_features SET artikel_id={$this->getId()}, features_id=$id";
        $result = mysql_query($query, static::$db);
        if(!$result)
            throw new Exception("Datenbankfehler: ".mysql_error(static::$db), MeltingShop::E_DATABASEERROR);
    }
    
    /**
     * entfernt eine verknüpfte Kategorie
     *
     * @param int $id
     */
    public function removeKategorieId($id){
        if(!$this->getId())
            throw new Exception("Kategorien können nur an gespeicherte Produkte geknüpft werden!", Artikel::E_UNINTIALIZED);
        $id = (int) $id;
        if(!$id)
            throw new Exception("Versuch einer Verknüpfung mit Null-Kategorie", Artikel::E_UNINTIALIZED);
            
        $query = "DELETE FROM artikel_kategorien WHERE artikel_id={$this->getId()} AND kategorien_id=$id";
        $result = mysql_query($query, static::$db);
        if(!$result)
            throw new Exception("Datenbankfehler: ".mysql_error(static::$db), MeltingShop::E_DATABASEERROR);
        $this->getKategorieIds(true);
    }

    /**
     * entfernt verknüpfte Features
     */
    public function removeFeatureIds(){
        if(!$this->getId())
            throw new Exception("Features können nur an gespeicherte Produkte geknüpft werden!", Artikel::E_UNINTIALIZED);
            
        $query = "DELETE FROM artikel_features WHERE artikel_id={$this->getId()}";
        $result = mysql_query($query, static::$db);
        if(!$result)
            throw new Exception("Datenbankfehler: ".mysql_error(static::$db), MeltingShop::E_DATABASEERROR);
    }
    
    
    /**
     * entfernt alle verknüpften Kategorien
     *
     */
    public function removeKategorieIds(){
        if(!$this->getId())
            throw new Exception("Kategorien können nur an gespeicherte Produkte geknüpft werden!", Artikel::E_UNINTIALIZED);
        $query = "DELETE FROM artikel_kategorien WHERE artikel_id={$this->getId()}";
        $result = mysql_query($query, static::$db);
        if(!$result)
            throw new Exception("Datenbankfehler: ".mysql_error(static::$db), MeltingShop::E_DATABASEERROR);
        $this->getKategorieIds(true);
    }
    
    /**
     * Alias für removeKategorieIds()
     *
     */
    public function removeKategorien(){
        $this->removeKategorieIds();
    }
    
    public function getKategorien(){
        $cat_ids = $this->getKategorieIds();
        foreach($cat_ids as $k=>$cat_id){
            $cat_ids[$k] = new Kategorie($cat_id);
        }
        return $cat_ids;
    }
    
    public function getAKategorie(){
        $cat_ids = $this->getKategorieIds();
        foreach($cat_ids as $k=>$cat_id){
            $cat_ids[$k] = new Kategorie($cat_id);
            if($cat_ids[$k]->get('status') == 'aktiviert')
                return $cat_ids[$k]; 
        }
        throw new Exception("Artikel hat keine Kategorie!", MeltingShop::E_OBJECTNOTFOUND);
    }
    
    public function addKategorie(Kategorie $k){
        $this->addKategorieId($k->getId());
    }
    
    public function removeKategorie(Kategorie $k){
        $this->removeKategorieId($k->getId());
    }
    
    /**
     * @return string
     */
    public function getStatus(){
        return $this->get('status');
    }
    
    /**
     * @return bool
     */
    public function isAktiviert(){
        return $this->getStatus() == 'aktiviert';
    }
    
    /**
     * Die Kategorie
     *
     * @return Kategorie
     */
    public function getKategorie(){
        if(!$this->kategorie){
            $cat_id = $this->getKategorieId();
            $this->kategorie =  $this->getKatalog()->getKategorieById($cat_id); // new Kategorie($cat_id);
        }
        return $this->kategorie;
    }
    
    public function setKategorie(Kategorie $kategorie){
        $this->kategorie = $kategorie;
        $this->set('kategorien_id', $kategorie->getId());
    }
    
    /**
     * Die URL zu diesem Produkt. Alias zu getURI
     *
     * @return string
     */
    public function getUrl($kategorie=null){
        return $this->getURI($kategorie);
    }
    
    /* Bilder */
    
    public function getKategorieName(){
        try{
            return $this->getKategorie()->getName();
        } catch(Exception $e){
            return "-";
        }
    }
    
    /**
     * @return array of Bild
     */
    public function getBilder($typ, $max=0){
        $max = (int) $max;
        $limit = $max?" LIMIT 0,$max":'';
        $query = "SELECT artikel_dateien.* FROM artikel_dateien
    	 	LEFT JOIN dateien ON (dateien.id = artikel_dateien.dateien_id)
        	WHERE artikel_dateien.artikel_id='{$this->getId()}' AND artikel_dateien.typ = '$typ'
    		ORDER BY dateien.dateiname ASC 
            $limit
        	";
		$result = mysql_query($query, MeltingShop::$db);
        if(!$result){
            throw new Exception("Konnte Bilder nicht laden, Datenbankfehler: ".mysql_error(static::$db));
        }
		$bilder = array();
        while($result && $line = mysql_fetch_assoc($result)){
            $b = new Bild($line['dateien_id']);
            if(!$b->getId()){
                $this->bereinigeBilder();
                continue;
            }
            $bilder[] = $b;
        }
        return $bilder;
    }
    
    /**
     * @param $typ
     * @return Bild
     */
    public function getErstesBild($typ){
        $bilder = $this->getBilder($typ, 1);
        if ( count($bilder) > 0 )
            return reset($bilder);
        return new Bild(); 
    }
    
    protected function bereinigeBilder(){
        $query = "DELETE artikel_dateien.* FROM artikel_dateien LEFT JOIN dateien ON (dateien.id=artikel_dateien.dateien_id) WHERE dateien.id IS NULL";
        mysql_query($query, MeltingShop::$db);
    }
    
    protected function bereinigeTexte(){
        $query = "DELETE texte.* FROM texte LEFT JOIN artikel ON (texte.id=artikel.id AND namespace='artikel') 
        	WHERE 
        	namespace='artikel' AND
        	artikel.id IS NULL AND texte.id > 0";
        $result = mysql_query($query, MeltingShop::$db);
        // echo $query;
        if($result == false)
            throw new Exception("Textbereinigung fehlgeschlagen: ".mysql_error(MeltingShop::$db));
        
        $query = "DELETE texte.* FROM texte  
        	WHERE 
        	namespace='artikel' 
        	AND
        	code NOT IN ('".implode("','",$this->getTextFields() )."')";
        // echo $query;
        $result = mysql_query($query, MeltingShop::$db);
        if($result == false)
            throw new Exception("Textbereinigung fehlgeschlagen: ".mysql_error(MeltingShop::$db));
    }

    
    
    public static function bereinigeKategorien(){
        $query = "DELETE artikel_kategorien.* FROM artikel_kategorien 
        	LEFT JOIN kategorien ON (artikel_kategorien.kategorien_id=kategorien.id) 
        	LEFT JOIN artikel ON (artikel_kategorien.artikel_id=artikel.id)
        	WHERE 
        	kategorien.id IS NULL
        	OR
        	artikel.id IS NULL
        	";
        $result = mysql_query($query, MeltingShop::$db);
        if(!$result){
            throw new Exception(mysql_error(MeltingShop::$db));
        }
        
        $artikels = self::getAll("LEFT JOIN kategorien ON ( artikel.kategorien_id = kategorien.id ) WHERE kategorien.id IS NULL AND artikel.kategorien_id  > 0");
        foreach($artikels as $artikel){
            if($artikel->hasField('kategorien_id')){
                $cat_ids = $artikel->getKategorieIds(true);

                if(empty($cat_ids)){
                    $artikel->set('kategorien_id', 0);
                }
                else
                    $artikel->set('kategorien_id', (int) reset($cat_ids));
                
                $result = $artikel->save(true);
                if(!$result){
                    throw new Exception(mysql_error(MeltingShop::$db));
                }
            }
        }
    }
    
    /**
     * Liste der möglichen Bildtypen
     *
     * @return array of string
     */
    public function getBildTypen(){
        return get_enum_array(MeltingShop::$db, 'artikel_dateien', 'typ');
    }
    
    public function addBild($bild, $typ=null){
        
        if(!$typ)
            $typ = reset($this->getBildTypen());
        
        if($bild instanceof Bild)
            $dateien_id = (int) $bild->getId();
        else
            $dateien_id = (int) $bild;
            
        $artikel_id = (int) $this->getId();
        $query = "REPLACE INTO artikel_dateien SET dateien_id=$dateien_id, artikel_id=$artikel_id, typ='$typ'";
        $result = mysql_query($query, MeltingShop::$db);
        return $result;
    }
    
    public function removeBild($bild, $typ='vorschau'){
        if($bild instanceof Bild)
            $dateien_id = (int) $bild->getId();
        else
            $dateien_id = (int) $bild;
            
        $artikel_id = (int) $this->getId();
        $query = "DELETE FROM artikel_dateien WHERE dateien_id=$dateien_id AND artikel_id=$artikel_id AND typ='$typ'";
        $result = mysql_query($query, MeltingShop::$db);
        return $result;
    }
    
    public function removeBilder(){
        $query = "DELETE FROM artikel_dateien WHERE artikel_id={$this->getId()}";
        $result = mysql_query($query, MeltingShop::$db);
        return $result;
    }
    
    /* Preise */
    
    /**
     * Gibt den Preis inkl. behaldlung von Sonderpreisen und selektierter Optionen zurück
     * 
     * @return float
     */
    function getPreis($anzahl=1){
        $preis = (float) $this->get('sonderpreis');
        if(!$preis){
            $preis = (float) $this->get('preis');
        }
        
        if($anzahl > 1 AND isset($this->preisstaffel)){
        	$preis = $this->preisstaffel->getEinzelPreis($anzahl);
        }
        
        return $preis + $this->getOptionenPreis($anzahl) + $this->getAttributePreis();
    }
    
    function getBasisPreis($anzahl=1){
        $preis = (float) $this->get('sonderpreis');
        if(!$preis){
            $preis = (float) $this->get('preis');
        }
        
        if($anzahl > 1 AND isset($this->preisstaffel)){
            $preis = $this->preisstaffel->getEinzelPreis($anzahl);
        }
        return $preis;
    }
    
    /**
     * Gibt den Preis inkl. behaldlung von Sonderpreisen und selektierter Optionen zurück
     *
     * @return float
     */
    function getLieferantenPreis(){
    	$preis = (float) $this->getBasisLieferantenPreis();
    	return $preis + $this->getOptionenLieferantenPreis() + $this->getAttributeLieferantenPreis();
    }
    
    function getBasisLieferantenPreis(){
    	$preis = (float) $this->get('lieferanten_preis');
    	if(!$preis){
    		return $this->get('preis');
    	}
    	return $preis;
    }
    
    /**
     * Gibt den Preis ohne SpezialOptionen zurück
     *
     * @return float
     */
    function getPreisOhneOptionen(){
    	$preis = (float) $this->get('sonderpreis');
    	if(!$preis){
    		$preis = (float) $this->get('preis');
    	}
    
    	return $preis + $this->getAttributePreis();
    }
    
    function getLieferantenPreisOhneOptionen(){
		$preis = (float) $this->getBasisLieferantenPreis();
    	return $preis + $this->getAttributeLieferantenPreis();
    }
    

    /**
     * Gibt den Preis ohne Behandlung von Sonderpreisen aber inkl. selektierter Optionen zurück
     * 
     * @return float
     */
    public function getGrundPreis(){
        $preis = (float) $this->get('preis');
        return $preis + $this->getOptionenPreis() + $this->getAttributePreis();
    }
    
    public function getVersteuertenPreis($land=null){
        return $this->getBruttoPreis($land);
    }
    
    /**
     * Alias für getBruttoPreis
     *
     * @param int $kundensteuerklasse_id
     * @return number
     */
    public function getBruttoPreis($kundensteuerklasse_id=null){
    	return $this->getNettoPreis() + $this->getSteuer($kundensteuerklasse_id);
    }
    
    /**
     * @param int $kundensteuerklasse_id
     * @return number
     */
    public function getBruttoGrundPreis($kundensteuerklasse_id=null){
    	$netto = $this->getGrundPreis();
    	$produkt = new WarenkorbSteuerprodukt($this->getSteuerklassenId(), $netto);
    	$steuern = Steuerregel::getSteuern(array($produkt), $kundensteuerklasse_id);
    	$steuersumme = 0;
    	foreach($steuern as $steuer){
    		$steuersumme+=$steuer->getSumme();
    	}
    	return $netto + $steuersumme;
    }
    
    
    /**
     * Gibt je nach Konfiguration den Bruttopreis oder den Nettopreis zurück
     * 
     * @param int $kundensteuerklasse_id
     * @return number
     */
    public function getAnzeigePreis($kundensteuerklasse_id=null){
    	return Katalog::bruttoPreise()?$this->getBruttoPreis($kundensteuerklasse_id):$this->getPreis();
    }
    
    /**
     * Gibt je nach Konfiguration den Bruttopreis oder den Nettopreis zurück
     *
     * @param int $kundensteuerklasse_id
     * @return number
     */
    public function getAnzeigeGrundPreis($kundensteuerklasse_id=null){
    	return Katalog::bruttoPreise()?$this->getBruttoGrundPreis($kundensteuerklasse_id):$this->getGrundPreis();
    }
    

    public function getLieferantenSteuer(){
    	$summe = 0;
    	foreach($this->getLieferantenSteuern() as $steuer){ /* @var $steuer Steuersumme */
    		$summe += $steuer->getSumme();
    	}
    	return $summe;
    }
    
    public function getLieferantenSteuerRate(){
    	return $this->getSteuerRate($this->getLieferantenSteuerklassenId());
    }
    
    public function getLieferantenSteuern(){
    	return Steuerregel::getSteuern(array($this), $this->getLieferantenSteuerklassenId());
    }
    
    public function getLieferantenSteuerklassenId(){
    	try{
    		$id = $this->getLieferant()->get('kundensteuerklasse_id');
    	} catch(Exception $e){
    		$id = null;
    	}
    	$id = $id?(int)$id:null;
    	return $id;
    }
    
    /**
     * @return Lieferant
     */
    public function getLieferant(){
    	$lieferant = new Lieferant((int) $this->get('lieferant_id'));
    	return $lieferant;
    }
    
    public function getSteuer($kundensteuerklasse_id=null){
    	$summe = 0;
        foreach($this->getSteuern($kundensteuerklasse_id) as $steuer){ /* @var $steuer Steuersumme */
        	$summe += $steuer->getSumme();
        }
        return $summe;
    }
    
    /**
     * Gibt die Steuerbeträge für diesen Artikel zurück
     * 
     * @param int $kundensteuerklasse_id
     * @return array of SteuerSumme
     */
    public function getSteuern($kundensteuerklasse_id=null){
    	$steuern = Steuerregel::getSteuern(array($this), $kundensteuerklasse_id);
    	return $steuern;
    }
    
    /**
     * Gibt die zutreffenden Steuerregeln zurück
     * 
     * @param string|int $land Land oder Steuerregel-ID
     * @return array of SteuerRegel
     */
    public function getSteuerRegeln($land=null){
    	if(is_numeric($land)){
    		$steuern = Steuerregel::getFor($this->getSteuerklassenId(), $land);
    	} else {
    		$steuern = Steuerregel::getForLand($this->getSteuerklassenId(), $land);
    	}
    	return $steuern;
    }
    
    /**
     * Gibt die Steuerrate, summiert aus allen zutreffenden Steuerregeln in Prozent zurück
     * 
     * @param string|int $land Land oder Steuerregel-ID
     * @return float
     */
    public function getSteuerRate($land=null){
    	$rate = 0;
    	foreach($this->getSteuerregeln($land) as $steuer){
    		$rate += $steuer->getProzente();
    	}
    	return $rate;
    }
    
    /**
     * Gibt zurück ob Preise mit oder ohne Steuern angezeigt werden sollen
     * 
     */
    public function isSteuerInkl(){
        return Katalog::bruttoPreise();
    }
    
    /**
     * Hat der Artikel einen Sonderpreis?
     * 
     * @return bool
     */
    public function hasSonderPreis(){
        return $this->get('sonderpreis') > 0;
    }
    
    /**
     * Gibt den Preis der selektierten Optionen zurück
     * 
     * @return flaot
     */
    /**
     * @param int $anzahl Stueckzahl. Vorgabe 1 — damit arbeitet jeder
     *        bestehende Aufruf ohne Argument genau wie vorher. Die Menge
     *        braucht allein die Preisformel in SpezialoptionSpezial fuer
     *        die Mengenstaffel; alle anderen Spezialoptionen ignorieren sie.
     */
    public function getOptionenPreis($anzahl=1){
        $preis=0;
        try{
            $spezialpreis = (float) $this->getSpezialoption()->getAufpreis(array(), $anzahl);    
        } catch(Exception $e){
            $spezialpreis = 0;
        }
        $preis += $spezialpreis;
        return $preis;
    }
    
    /**
     * Gibt den Preis der selektierten Optionen zurück
     *
     * @return flaot
     */
    public function getLieferantenOptionenPreis(){
    	$preis=0;
    	try{
    		$spezialpreis = (float) $this->getSpezialoption()->getAufpreis(array('lieferantenpreis' => 1));
    	} catch(Exception $e){
    		$spezialpreis = 0;
    	}
    	$preis += $spezialpreis;
    	return $preis;
    }
    
    public function getOptionenLieferantenPreis(){
    	$preis=0;
    	try{
    		$spezialpreis = (float) $this->getSpezialoption()->getAufpreis(array('lieferantenpreis' => 1));
    	} catch(Exception $e){
    		$spezialpreis = 0;
    	}
    	$preis += $spezialpreis;
    	return $preis;
    }
    
    
    public function getAttributePreis(){
        $preis=0;
        foreach($this->getAttribute() as $attribut){ /* @var $attribut ArtikelAttribut*/
            $preis += $attribut->getSelectedPreis();
        }
        return $preis;
    }
    
    public function getAttributeLieferantenPreis(){
    	$preis=0;
    	foreach($this->getAttribute() as $attribut){ /* @var $attribut ArtikelAttribut */
    		$preis += $attribut->getSelectedLieferantenPreis();
    	}
    	return $preis;
    }
    
    
    
    public function getURI($kategorie=null){
        $s = MM::shop();
        
        //if($kategorie == null)
        //    $kategorie = $this->getAKategorie();
        $kategorie = $this->getKategorie();
        $base = $this->getKatalog()->getKatalogBase()->getLink();
        $base = $base[strlen($base)-1] == '/'?$base:$base.'/';
        $urlpath = $kategorie->getUrlPathStr();
        $urlpath = empty($urlpath)?'':$urlpath.'/';
        return $base.$urlpath.$this->getUrlkey();
    }
    
    /* laden / speichern */
    public function save($update = false){
        if($this->hasSpezialoption()){
            try{
                $this->set('spezialoption_data', serialize($this->getSpezialoption()));
            } catch(Exception $e){
                // $this->set('spezialoption_data', '');
            }
        }
        if($this->hasField('urlkey')){
        	$urlkey = $this->get('urlkey');
        	if(empty($urlkey)){
        		$urlkey = $this->getArtikelnummer();
        	}
        	$this->set('urlkey', urify_str($urlkey)); // Url-Key normalisieren
        }
        $ok = parent::save($update);
        if($ok){
        	if(isset($this->preisstaffel) AND $this->preisstaffel instanceof Component){
        		$this->preisstaffel->save();
        	}
        }
        return $ok;
    }
    
    public function delete(){
        $ok = parent::delete();
        if($ok){
            $this->bereinigeBilder();
            $this->bereinigeTexte();
            // $this->bereinigeOptionen();
        }
        return $ok;
    }
    
    /**
     * @return Katalog
     */
    protected function getKatalog(){
        return MM::shop()->getPlugin('Katalog');
    }
    
    public static function checkUniqueUrlkey($key, $cat_id = false){
        $key = mysql_real_escape_string($key);
        if($cat_id !== false)
            $cat_add = " AND kategorie_id=". (int) $cat_id;
        else 
            $cat_add = '';
        $query = "SELECT id FROM artikel WHERE urlkey='$key' ".$cat_add;
        $result = mysql_query($query, MeltingShop::$db);
        if($result && mysql_num_rows($result) > 0)
            return false;
        return true;
    }
    
    public static function checkUniqueArtikelnummer($key){
        $key = mysql_real_escape_string($key);
        $query = "SELECT id FROM artikel WHERE artikelnummer='$key'";
        $result = mysql_query($query, MeltingShop::$db);
        if($result && mysql_num_rows($result) > 0)
            return false;
        return true;
    }
    
    public function getGruppenId(){
    	if(!MM::shop()->isPluginLoaded('KatalogArtikelGruppen')){
    		return 0;
    	}
        if($this->artikel_gruppe_id === null){
            $query = "SELECT id FROM artikel_gruppen WHERE artikel_id=".(int) $this->getId();
            $result = mysql_query($query, static::$db);
            if(!$result)
                throw new Exception("Konnte Artikelgruppe nicht laden: ".mysql_error(static::$db) );
            if(mysql_num_rows($result) == 0){
                $this->artikel_gruppe_id = 0;
            } else {
                $this->artikel_gruppe_id = (int) mysql_result($result, 0, 'id');
            }
        }
        return $this->artikel_gruppe_id;
    }

    /**
     * @return ArtikelGruppe
     */
    public function getGruppe(){
        $id = $this->getGruppenId();
        if(!$id){
            throw new Exception("Artikel {$this->getId()} ist nicht gruppiert!");
        }
        if($this->artikel_gruppe === null){
            $gruppe = new ArtikelGruppe($id);
            $this->artikel_gruppe = $gruppe;
        }
        return $this->artikel_gruppe;
    }
    
    public function setGruppenId($gruppen_id){
        ArtikelGruppe::setArtikelGruppe($this->getId(), $gruppen_id);
    }
    
    public function hasZubehoer(){
        $z = $this->get('zubehoer');
        return !empty($z);
    }
    
    /**
     * Gibt ein Array von Artikel zurück die als Zubehör markiert sind
     * 
     * @return array of Artikel
     */
    public function getZubehoer(){
        if($this->zubehoer === null){
            $artikelnummern = explode(',', $this->get('zubehoer'));
            foreach($artikelnummern as $k=>$artikelnummer){
                $artikelnummer = mysql_real_escape_string(trim($artikelnummer));
                if(!empty($artikelnummer))
                    $artikelnummern[$k] = $artikelnummer;
                else 
                    unset($artikelnummern[$k]);
            }
            if(empty($artikelnummern)){
                $this->zubehoer = array();
            } else {
                $select = "WHERE artikelnummer IN ( '".implode("','", $artikelnummern)."') AND artikel.status!='deaktiviert' ORDER BY artikelnummer ASC";
                $this->zubehoer = Artikel::getAll($select);
            }
        }
        return $this->zubehoer;
    }
    
    /**
     * Wird aufgerufen bevor der Artikel in einer Bestellung gespeichert wird
     */
    public function beforeAddToOrder(){
        if($this->hasSpezialoption()){
            try{
                $this->getSpezialoption()->beforeAddToOrder();
            } catch(Exception $e){
                error_log("Konnte Spezialoption von {$this->getId()} nicht vor der Bestellungsabwicklung behandeln!");
            }
        }
    }
    
    public function getSteuerklassenId(){
    	return (int) $this->get('steuerklassen_id');
    }

    /**
     * Gibt die Steuerklasse dieses Artikels zurück
     * @return Steuerklasse
     */
    public function getSteuerklasse(){
        if(!isset($this->steuerklasse)){
            $klassen_id = (int) $this->get('steuerklassen_id');
            $klasse = Steuerklasse::getItem($klassen_id);
            if(!$klasse->isLoaded()){
                throw new Exception("Steuerklasse $klassen_id wurde nicht gefunden!");
        }
            $this->steuerklasse = $klasse;
        }
        return $this->steuerklasse;
    }
    
    /**
     * Gibt ein Assoziatives Array mit numerischen Werten zurück das den Artikel mit den gewählten Eigenschaften eindeutig identifiziert
     * Nur für die benutzung im Warenkorb
     * 
     * @return array
     */
    public function getDummyWarenkorbOptionen(){
    	$options = array();
    	foreach($this->getAttribute() as $attr){ /* @var $attr ArtikelAttribut */
    		$options[$attr->getCode().'---'.$attr->getSelectedWert()] = 1;
    	}
    	try{
    		$so = $this->getSpezialoption();
    		$spez_code = sha1(get_class($so).serialize($this->getSpezialoption()->getData()));
    		$options[$spez_code] = 1;
    	} catch(Exception $e){
    	}
    	$options['kommentar'] = $this->getBestellKommentar();
    	$wrap = new stdClass; // workaround for passing by reference
    	$wrap->options = $options;
    	MM::shop()->callEvent('CollectWarenkorbDummyOptionen', $wrap, $this);
    	return $wrap->options;
    }
    
    /**
     * Erzeugt einen Mini-Warenkorb mit diesem Artikel zwecks Versandkosten- oder Steuerberechnungen
     * 
     * @param string $land
     * @param string $versandart
     * @return Warenkorb
     */
    public function getEinzelWarenkorb($land = null, $versandart=null, $kundensteuerklasse_id=null){
    	$w = new Warenkorb();
    	$w->addArtikel($this,1);
    	$w->setAddressArray(array('land', $land?$land:Sessionkorb::getSelectedLand()));
    	$w->setVersandart($versandart?$versandart:Sessionkorb::getSelectedVersandart());
    	$w->setKundenSteuerklassenId($kundensteuerklasse_id);
    	return $w;
    }
}