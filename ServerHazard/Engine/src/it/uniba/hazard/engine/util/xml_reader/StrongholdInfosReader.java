package it.uniba.hazard.engine.util.xml_reader;

import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.main.Resource;
import it.uniba.hazard.engine.main.StrongholdInfo;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


public class StrongholdInfosReader {
    public static List<StrongholdInfo> readStrongholdInfos (String path){
        try {
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element strongholdInfos = (Element) gameElem.getElementsByTagName("strongholdInfos").item(0);
            NodeList strongholdInfoList = strongholdInfos.getElementsByTagName("strongholdInfo");

            ArrayList<StrongholdInfo> strongholdInfoArrayList = new ArrayList<StrongholdInfo>();
            for (int i =0; i < strongholdInfoList.getLength(); i++){
                Element strongholdInfo = (Element) strongholdInfoList.item(i);

                String emergency = strongholdInfo.getElementsByTagName("emergency").item(0).getTextContent();
                Emergency em = (Emergency) Repository.getFromRepository(Emergency.class.getName() + "_" + emergency);

                String resNeeded = strongholdInfo.getElementsByTagName("resourceNeeded").item(0).getTextContent();
                Resource res = (Resource) Repository.getFromRepository(Resource.class.getName() + "_" + resNeeded);

                String strongholdName = strongholdInfo.getElementsByTagName("strongholdName").item(0).getTextContent();

                StrongholdInfo strInfo = new StrongholdInfo(em, res, strongholdName);
                strongholdInfoArrayList.add(strInfo);
            }
            return strongholdInfoArrayList;
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        }
        return null;
    }
}