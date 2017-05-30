package it.uniba.hazard.engine.util.xml_reader;

import it.uniba.hazard.engine.endgame.EndCondition;
import it.uniba.hazard.engine.endgame.LossCondition;
import it.uniba.hazard.engine.endgame.VictoryCondition;
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

public class EndGameReader {
    public static List<VictoryCondition> readVictoryConditions(String path){
        try{
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element endGameElem = (Element) gameElem.getElementsByTagName("endGame").item(0);

            NodeList victCondList = endGameElem.getElementsByTagName("victoryCondition");
            ArrayList<VictoryCondition> victoryConditionsList = new ArrayList<VictoryCondition>();

            for (int i = 0; i< victCondList.getLength(); i++){
                Element element = (Element) victCondList.item(i);
                String message = element.getElementsByTagName("victoryMessage").item(0).getTextContent();
                String type = element.getElementsByTagName("type").item(0).getTextContent();

                //TODO da rivedere
                Class victoryClass = Class.forName("it.uniba.hazard.engine.endgame."+type);
                VictoryCondition vc = (VictoryCondition) victoryClass.newInstance();

                victoryConditionsList.add(vc);
            }

            return victoryConditionsList;
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InstantiationException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static List<LossCondition> readLossConditions(String path){
        try{
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element endGameElem = (Element) gameElem.getElementsByTagName("endGame").item(0);

            ArrayList<LossCondition> lossConditionsList = new ArrayList<LossCondition>();

            NodeList lossCondList = endGameElem.getElementsByTagName("lossCondition");
            for (int i = 0; i< lossCondList.getLength(); i++){
                Element element = (Element) lossCondList.item(i);
                String message = element.getElementsByTagName("lossMessage").item(0).getTextContent();
                String type = element.getElementsByTagName("type").item(0).getTextContent();

                //TODO da rivedere
                Class lossClass = Class.forName("it.uniba.hazard.engine.endgame."+type);
                LossCondition lc = (LossCondition) lossClass.newInstance();

                lossConditionsList.add(lc);
            }

            return lossConditionsList;
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InstantiationException e) {
            e.printStackTrace();
        }
        return null;
    }

}
