package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.exception.NoClassExist;
import it.uniba.hazard.engine.map.Location;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Random;


/**
 * Manager of the cards.
 * @param <C> Type of the card.
 */
public class CardManager<C> {

    public List<C> cards = new ArrayList<C>();

    public List<C> instanceCards = new ArrayList<C>();
    public HashMap<ProductionCard,Integer> instanceProductionCards = new HashMap<ProductionCard,Integer>();

    public CardManager(){};

    public CardManager(List<C> cards) {
        this.cards = cards;
    }

    /**
     * List of cards extracted.
     * @param numberCards number of cards
     * @return cards extracted
     */
    public List<C> getCards(int numberCards){
        resetCards();
        List<C> extractCards = new ArrayList<C>();

        for(int i = 0; (cards.size() > 0 && i < numberCards); i++) {
            int number = numRandom();
            extractCards.add(cards.get(number));
            cards.remove(number);
        }

        return  extractCards;
    }

    /**
     * List of production cards extracted.
     * @param locationTransportPawns location of transport pawns
     * @param numberCards number of cards
     * @return production cards extracted
     */
    public List<C> getProductionCards(List<Location> locationTransportPawns, int numberCards){
        resetCards();
        List<C> extractedCards = new ArrayList<C>();
        int i = 0;
        while(cards.size() > 0 && i < numberCards){
            int number = numRandom();
            ProductionCard card = (ProductionCard) cards.get(number);
            Location l = card.getLocation();
            if (!locationTransportPawns.contains(l)){
                extractedCards.add(cards.get(number));
                i++;
            }
            cards.remove(number);

        }
        return extractedCards;
    }

    private int numRandom(){
        Random random = new Random();
        int number = random.nextInt(cards.size());
        return number;
    }

    /**
     * Instance production cards.
     * @param pc Production card
     * @param quantity number of cards
     */
    public void instanceCard(ProductionCard pc, int quantity){
        instanceProductionCards.put(pc,quantity);
    }

    /**
     * Instance the cards from xml.
     * @param name name of the card
     * @param quantity number of cards
     */
    public void instanceCard(String name, int quantity){
        try {
            try {
                Constructor c = Class.forName("it.uniba.hazard.engine.cards." + name).getConstructor(String.class);
                try {
                    for(int i= 0; i < quantity; i++){
                        instanceCards.add((C) c.newInstance(name));
                    }
                } catch (InstantiationException e) {
                    e.printStackTrace();
                } catch (IllegalAccessException e) {
                    e.printStackTrace();
                } catch (InvocationTargetException e) {
                    e.printStackTrace();
                }

            } catch (NoSuchMethodException e) {
                e.printStackTrace();
            }

        } catch (ClassNotFoundException e) {
            throw new NoClassExist("Classe non istanziata");
        }
    }

    /**
     * Adds the specified cards to the list of cards.
     * @param cards list of cards to add
     */
    public void instanceCardsNew(List<Card> cards) {
        for (Card c : cards) {
            instanceCards.add((C) c);
        }
    }

    private void resetCards() {
        cards = new ArrayList<C>();
        for(C c : instanceCards) {
            cards.add(c);
        }
    }

    private void resetProductionCards() {
        cards = new ArrayList<C>();
        for (ProductionCard c : instanceProductionCards.keySet()) {
            for (int i = 0; i < instanceProductionCards.get(c); i++) {
                cards.add((C) c);
            }
        }
    }


}
