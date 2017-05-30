package it.uniba.hazard.engine.test;


import it.uniba.hazard.engine.util.xml_reader.GroupReader;
import it.uniba.hazard.engine.util.xml_reader.ResourceReader;

public class XMLReaderTest {
    public static void main (String[] args){
        //GroupReader.readActionGrooups("strutturaxml.xml");
        //GroupReader.readProductionGrooups("strutturaxml.xml");
        ResourceReader.readResources("strutturaxml.xml");
    }
}
