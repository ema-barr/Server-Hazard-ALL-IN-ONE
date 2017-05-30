package it.uniba.hazard.engine.util.xml_reader;

import it.uniba.hazard.engine.cards.BonusCard;
import it.uniba.hazard.engine.cards.Card;
import it.uniba.hazard.engine.cards.EventCard;
import it.uniba.hazard.engine.cards.ProductionCard;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.main.Resource;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.xml_reader.card_reading.CardReaderFactory;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class XmlCardsReader {
    public static List<List<Card>> readBonusCards(String path){
        //List that contains all lists of cards. Each inner list contains instances of the same card
        List<List<Card>> allCards = new ArrayList<>();

        try {
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element cardsElem = (Element) gameElem.getElementsByTagName("cards").item(0);
            Element bonusElem = (Element) cardsElem.getElementsByTagName("bonusCards").item(0);

            NodeList bonusCardNodeList = bonusElem.getElementsByTagName("bonusCard");

            for (int i = 0; i < bonusCardNodeList.getLength(); i++){
                Element bonusCardNode = (Element) bonusCardNodeList.item(i);
                String name = bonusCardNode.getElementsByTagName("name").item(0).getTextContent();

                allCards.add(CardReaderFactory.getReader(name).readCard(bonusCardNode));
            }
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        }
        return allCards;
    }

    public static List<List<Card>> readEventCards(String path){
        //List that contains all lists of cards. Each inner list contains instances of the same card
        List<List<Card>> allCards = new ArrayList<>();

        try {
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element cardsElem = (Element) gameElem.getElementsByTagName("cards").item(0);
            Element bonusElem = (Element) cardsElem.getElementsByTagName("eventCards").item(0);

            NodeList bonusCardNodeList = bonusElem.getElementsByTagName("eventCard");

            for (int i = 0; i < bonusCardNodeList.getLength(); i++){
                Element bonusCardNode = (Element) bonusCardNodeList.item(i);
                String name = bonusCardNode.getElementsByTagName("name").item(0).getTextContent();

                allCards.add(CardReaderFactory.getReader(name).readCard(bonusCardNode));
            }
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        }
        return allCards;
    }

    public static List<List<Card>> readProductionCards(String path){
        //List that contains all lists of cards. Each inner list contains instances of the same card
        List<List<Card>> allCards = new ArrayList<>();

        try {
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element cardsElem = (Element) gameElem.getElementsByTagName("cards").item(0);
            Element prodElem = (Element) cardsElem.getElementsByTagName("productionCards").item(0);

            NodeList prodCardNodeList = prodElem.getElementsByTagName("productionCard");
            HashMap<ProductionCard, Integer> prodMap = new HashMap<ProductionCard, Integer>();

            for (int i = 0; i < prodCardNodeList.getLength(); i++){
                Element prodCardNode = (Element) prodCardNodeList.item(i);
                allCards.add(CardReaderFactory.getReader("ProductionCard").readCard(prodCardNode));
            }
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        }
        return allCards;
    }
}
