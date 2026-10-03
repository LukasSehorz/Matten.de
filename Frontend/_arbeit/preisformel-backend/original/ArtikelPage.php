<?php
class ArtikelPage extends KatalogPage{
    
	protected $_artikel = null;
	protected $kategorie = null;
	public $anzahl = 1;
    
	public function preDelivery(){
	    parent::preDelivery();
	    
        /* Umleiten zum nächten / vorherigen Artikel*/
	    if(!empty($_GET['rel'])){
            $rel = ($_GET['rel'] == 'next'?'next':'prev');
            
            $_id = $this->getCurrentArtikel()->getId();
            $_artikels = $this->getCurrentKategorie()->getArtikel();
            $current_key = null;
            foreach($_artikels as $_key => $_artikel){
                if($_artikel->getId() == $_id){
                    $current_key = $_key;
                    break;
                }
            }
            
            $rel_art = null;
            if($current_key !== null){
                $rel_key = $current_key + ($rel == 'next'?1:-1);
                $_c = count($_artikels);
                $rel_key = ($rel_key + $_c) % $_c;
                $rel_art = $_artikels[$rel_key];
            } 
            if(!$rel_art instanceof Artikel){
                $rel_art = $this->getCurrentArtikel();
            }
            // die($rel_art->getURI());
            $this->redirect($rel_art->getURI());
	    }
	    
	    if(!empty($_REQUEST['getpricejson'])){
	    	try{
	    		$prices = $this->getFormPrices();
	    		$error = false;
	    	} catch(Exception $e){
	    		$prices = array();
	    		$error = $e->getMessage();
	    	}
	    	echo json_encode(array('prices' => $prices, 'error' => $error));
	    	die();
	    }
	    
		if($this->getArtikelHauptKategorieId() != $this->getCurrentKategorieId() and $this->getCurrentKategorieId())
		    $this->redirect301($this->getCurrentArtikel()->getURI());
	    try{
            $this->getCurrentArtikel()->incAngesehen();
	    } catch(Exception $e){
	        error_log("Konnte angesehen-Variable nicht inkrementieren");
	    }
	    
	    // Produktvarianten-Auswahl
	    if(!empty($_REQUEST['gruppe']) && $this->getCurrentArtikel()->getGruppenId() > 0){
	        $gruppe = $this->getCurrentArtikel()->getGruppe();
	        
	        $auswahl = $_REQUEST['gruppe'];
	        $auswahl_vorgabe = $_REQUEST['gruppe_vorgabe'];
	        $auswahl_neu = array();
	        
	        // nach alter priorität (session), falls vorhanden, umsortieren
	        if(!empty($_SESSION['gruppenauswahl'][$gruppe->getId()])){
	            $auswahl_session = array();
	            foreach($_SESSION['gruppenauswahl'][$gruppe->getId()] as $attribute_code=>$attribute_value){
	                if(array_key_exists($attribute_code, $auswahl) ){
	                    $auswahl_session[$attribute_code] = $auswahl[$attribute_code];
	                    unset($auswahl[$attribute_code]);
	                }
	            }
	            foreach($auswahl as $attribute_code=>$attribute_value){
	                $auswahl_session[$attribute_code] = $auswahl[$attribute_code];
	            }
	            $auswahl = $auswahl_session;
            }
	        
	        // Nach priorität (geändert ja/nein) umsortieren
	        foreach($auswahl as $attribute_code=>$attribute_value){
	            if($attribute_value != $auswahl_vorgabe[$attribute_code]){
	                $auswahl_neu[$attribute_code] = $attribute_value;
	                unset($auswahl[$attribute_code]);  
	            }
	        }
	        foreach($auswahl as $attribute_code=>$attribute_value){
                $auswahl_neu[$attribute_code] = $attribute_value;
	        }
	        
	        // Auswahl in Session speichern
	        $_SESSION['gruppenauswahl'][$gruppe->getId()] = $auswahl_neu;
	        
	        // Am besten passenden Artikel suchen
	        $match_artikel = $gruppe->getBestMatch($auswahl_neu);
	        $this->redirect($match_artikel->getURI().(!empty($_REQUEST['block'])?'?block='.$_REQUEST['block']:''));
	    }
	}
	
	/**
	 * Gibt den gespeicherten Wert einer Gruppen-Attribut-Auswahl in der Session zurück.
	 *  
	 * @param int $gruppen_id
	 * @param string $attribute_code
	 * @return string
	 */
	public function getSavedGruppenAuswahl($gruppen_id, $attribute_code){
	    if(isset($_SESSION['gruppenauswahl'][$gruppen_id][$attribute_code]))
	        return $_SESSION['gruppenauswahl'][$gruppen_id][$attribute_code];
        return false;
	}
	
	public function getCurrentKategorieId(){
	    $id = (int) $this->getShop()->getNavigation()->getCurrentPage()->getOption('kategorie_id');
		/*$query = "SELECT id FROM kategorien WHERE urlkey='{$this->getUrlkey()}'";
		$result = mysql_query($query, $this->getDb());
		if($result)
			return mysql_result($result, 0 , 'id');*/
	    if(!$id)
    		return false;
	    return $id;
	}
	
	/**
	 * Gibt die aktuelle Kategorie zurück
	 *
	 * @return Kategorie
	 */
	public function getCurrentKategorie(){
	    if($this->kategorie == null)
	        $this->kategorie = $this->getKatalog()->getKategorieById($this->getCurrentKategorieId());
	    return $this->kategorie;
	}
	
	public function getArtikelHauptKategorie(){
	    return $this->getCurrentArtikel()->getKategorie();
	}
	
	public function getArtikelHauptKategorieId(){
	    return $this->getCurrentArtikel()->getKategorieId();
	}
	
	/**
	 *
	 * @return ShopNavigation
	 */
	public function getWarenkorbNavilink(){
		return $this->getShop()->getNavigation()->getPage('warenkorb');
	}
	
	/**
	 *
	 * @return Artikel
	 */
	public function getCurrentArtikel(){
	    if($this->_artikel == null){
            $n = $this->getShop()->getNavigation()->getCurrentPage();
            
            $artikel = $n->getOption('artikel');
            if(!($artikel instanceof Artikel)){
                $id = $n->getOption('artikel_id');
                $artikel = $this->getKatalog()->getArtikelById($id);
            }
            
            // Attribute vorauswählen (bei gesetztem Gruppenfilter)
            if($gruppen_id = $artikel->getGruppenId()){
                foreach($artikel->getAttribute() as $attribute){  /* @var $attribute ArtikelAttribut */
                    if($wert = $this->getSavedGruppenAuswahl($gruppen_id, $attribute->getCode())){
                        if($attribute->hasWert($wert))
                            $attribute->selectWert($wert);
                    }
                }
            }
            
            $this->_artikel = $artikel;
	    }
	    
	    return $this->_artikel;
	} 
	
	/**
	 * Gibt die Versandkosten für das aktuell selektierte Land zurück
	 * 
	 * @param Artikel $artikel
	 * @param bool|null $brutto
	 * @return number
	 */
	public function getEinzelVersandkosten(Artikel $artikel=null, $brutto=null , $anzahl=null){
		try{
			$brutto = $brutto!==null?$brutto:Katalog::bruttoPreise();
			$artikel = $artikel!==null?$artikel:$this->getCurrentArtikel();
			$korb = $artikel->getEinzelWarenkorb(Sessionkorb::getSelectedLand(), null, Sessionkorb::getFixedKundenSteuerklassenId());
			
			try{
				return Versandkosten::getVersandkosten($korb, $brutto,null, $anzahl);
			} catch(Exception $e){
				return Versandkosten::getVersandkosten($korb, $brutto, $korb->getCheapestVersandart(), $anzahl);
			}
		} catch(Exception $e){
        	return $this->getShop()->text('Der Versand dieses Artikels ist mit der gewählten Versandart zur Zeit nicht möglich.');
		}
	}
	
	/**
	 * Gibt einen "zurück" - Link zurück. Versucht diesen aus Referer, Session und Oberkategorie zu ermitteln
	 * 
	 */
	public function getBackLink(){
	    if(!empty($_SERVER['HTTP_REFERER'])){
	        // prüfen ob innerhalb der Domain
	        if(strpos($_SERVER['HTTP_REFERER'], $_SERVER['SERVER_NAME']) !== false)
	            return $_SERVER['HTTP_REFERER'];
	    } 
	    
	    if(!empty($_SESSION['REFERER'])){
	        return $_SESSION['REFERER'];
	    }
	    
        return $this->getCurrentArtikel()->getKategorie()->getURI();
	}
	
	public function getFormPrices(){
		$request = $_REQUEST;
		if(empty($request['artikel']) OR $request['artikel'] == 0) {
			throw new Exception("kein Artikel angegeben");
		}
		
		$selected_artikel = $this->getKatalog()->getArtikelById((int) $request['artikel']);
		 
		$anzahl_main = (int) $request['anzahl'];
		$eingabe = array();
		$eingabe[] = array(
			'artikel' => $selected_artikel,
			'anzahl' => $anzahl_main,
			'attribute' => isset($request['attribute'])?$request['attribute']:null,
			'zubehoer' => false,
		);
		
		if(!empty($request['zubehoer'])){
			foreach($request['zubehoer'] as $artikel_id => $artikel_post){
				// echo "adding zubehoer art $artikel_id";
				$_artikel = $this->getKatalog()->getArtikelById((int) $artikel_id);
				if(!$_artikel->getId()){
					continue;
				}
				$eingabe[] = array(
					'anzahl' => $anzahl_main * (int) $artikel_post['anzahl'],
					'artikel' => $_artikel,
					'attribute' => isset($request['attribute'])?$request['attribute']:null,
					'zubehoer' => true,
				);
			}
		}
		$ausgabe = array();
		
		foreach($eingabe as $post){
			$is_complete = true;
			
			$anzahl = (int) $post['anzahl'];
			$artikel = $post['artikel'];
			if(!empty($post['attribute'])){
				foreach($post['attribute'] as $attribute_code=>$wert){
					if(!$artikel->selectAttribut($attribute_code, $wert)){
						$is_complete = false;
					}
				}
			}
		
			// Spezialoption selektieren
			try{
				$artikel->getSpezialoption()->parseFrontendPost();
			} catch(Exception $e){
				if($e->getCode() == Spezialoption::E_SPEZ_NOCART){
				}
				$is_complete = false;
			}
			$k = $this->getKatalog();
			$warenkorb = $artikel->getEinzelWarenkorb($k->getSelectedLand(), $k->getSelectedVersandart(), Sessionkorb::getFixedKundenSteuerklassenId());
			
			$land = $warenkorb->getSelectedLand();
			$versand = $warenkorb->getSelectedVersandart();
			
			if(!$warenkorb->isVersandPossible()){
				$versand = $warenkorb->getCheapestVersandart();
			}
			
			if(Katalog::bruttoPreise()){
				$steuerrate = ($artikel->getSteuerRate($warenkorb->getKundenSteuerklassenId())+100)/100;
			} else {
				$steuerrate = 1;
			}
			
			$ausgabe[] = array(
				'artikel' => (int) $artikel->getId(),
				'preis' => round($artikel->getPreis()*$steuerrate,2),
				'grundpreis' => round($artikel->getGrundPreis()*$steuerrate,2), // ohne Sonderpreis, mit allem anderen
				'versand' => $this->getEinzelVersandkosten($artikel, Katalog::bruttoPreise(), $anzahl),
				// 'gewicht' => $artikel->getGewicht(),
				'attributepreis' => round($artikel->getAttributePreis()*$steuerrate,2),
				'optionenpreis' => round($artikel->getOptionenPreis()*$steuerrate,2),
				'is_complete' => $is_complete?true:false,
				'zubehoer' => $post['zubehoer']?true:false,
				'brutto' => Katalog::bruttoPreise()?true:false,
			);
		}
		return $ausgabe;
	}
}