<?php
class PreisstaffelFormFieldHandler extends BlankFormFieldHandler{

	/**
	 * Gibt ein Eingabecontrol für ein gegebenes Objekt und ein Feld zurück
	 *
	 * @param DbObject $item
	 * @param string $field
	 */
	public function getControl(DbObject $item, $field){
		if($item instanceof Artikel){ /* @var $item Artikel */
			switch($field){
				case 'preisstaffel':
					$out = self::getEnumInput($item, $field);
					$staffel = $item->preisstaffel->getStaffel();
					$out .= "<table class='shrinked'>";
					$out .= "<tr><th class='narrow'>ab Anzahl</th><th class='narrow'>Preis € / Rabatt %</th></tr>";
					$i=0;
					foreach($staffel as $anzahl=>$preis){
						$out .= "<tr>";
						$out .= "<td class='narrow'><input name='artikel_staffel[$i][anzahl]' value='$anzahl' /></td>";
						$out .= "<td class='narrow'><input name='artikel_staffel[$i][preis]' value='$preis' /></td>";
						$out .= "</tr>";
						$i++;
					}
					$out .= "<tr>";
					$out .= "<td class='narrow'><input name='artikel_staffel[$i][anzahl]' value='' /></td>";
					$out .= "<td class='narrow'><input name='artikel_staffel[$i][preis]' value='' /></td>";
					$out .= "</tr>";
					/*
					$out .= "<tr><th class='narrow'>ab Anzahl</th>";
					$i=0;
					foreach($staffel as $anzahl=>$preis){
						$out .= "<td><input name='artikel_staffel[$i][anzahl]' value='$anzahl' /></td>";
						$i++;
					}
					$out .= "<td><input name='artikel_staffel[$i][anzahl]' value='' /></td>";
					$out .= "</tr>";
					$out .= "<tr><th class='narrow'>Preis € / Rabatt %</th>";
					$i=0;
					foreach($staffel as $anzahl=>$preis){
						$out .= "<td><input name='artikel_staffel[$i][preis]' value='$preis' /></td>";
						$i++;
					}
					$out .= "<td><input name='artikel_staffel[$i][preis]' value='' /></td>";
					$out .= "</tr>";
					*/
					$out .= "</table>";
					
					return $out;
			}
		}
		return parent::getControl($item, $field);
	}

	/**
	 * Gibt ein Text-Label für ein gegebenes Objekt und ein Feld zurück
	 *
	 * @param DbObject $item
	 * @param string $field
	 */
	public function getLabel(DbObject $item, $field){
		if($item instanceof Artikel){
			switch($field){
				case 'preisstaffel':
					return "Preisstaffel";
			}
		}
		return false;
	}
}
