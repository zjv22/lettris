import java.util.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class WordTrie
{
   private final Node root = new Node((byte)-1);
   
   public WordTrie()
   {
   }
   
   public boolean contains(final String word)
   {
      final byte[] chars = convert(word);
      return chars != null && root.get(chars,0);
   }
   
   public void add(final String word)
   {
      final byte[] chars = convert(word);
      if (chars != null)
         root.add(chars, 0);
   }
   
   public String random()
   {
      return root.random(0);
   }
   
   // converts String into 0-26 upper cased ascii
   //  returns null if word contains invalid character code
   private static byte[] convert(final String word)
   {
      byte[] asc = word.toUpperCase().getBytes(StandardCharsets.US_ASCII);
      for (int i=0;i<asc.length;i++)
      {
         final int c = (((int) asc[i] & 0x07F) - 65);
         if (c < 0 || c > 26)
            return null;
         asc[i] = (byte) c;
      }
      return asc;
   }
   
   private void debug()
   {
      for ( Node n : root.children )
      {
         if(n != null)
           n.debug("");
      }
   }
   
   public int size()
   {
      return root.size();
   }
   
   public int nodeCount()
   {
      return root.nodeCount();
   }
   
   private static final class Node
   {
      // lowest 5 bits represent the UC character of this node
      //  high bit set indicates end of a complete word
      private byte code;
      
      // limited to UC alpha
      private Node[] children = null;
      
      private Node(final byte code)
      {
         this.code = code;
      }
      
      private void add(final byte[] word, final int depth)
      {
         if (depth == word.length)
         {
            this.code = (byte) (this.code | 0x80);
            return;
         }
         final byte c = word[depth];
         final int idx = (int) c;
         if (children == null)
            children = new Node[26];
         if (children[idx] == null)
            children[idx] = new Node(c);
         children[idx].add(word,depth+1);
      }
      
      private boolean get(final byte[] word, final int depth)
      {
         if (depth == word.length)
            return (this.code & 0x80) != 0;
            
         final byte c = word[depth];
         final int idx = (int) c;
         if (children == null || children[idx] == null)
            return false;
         return children[idx].get(word, depth+1);
      }
      
      private void debug(final String word)
      {
         final String w2 = word + ((char) (( (int)this.code & 0x7F) +65));
         if ((this.code & 0x80) != 0)
         {
            System.out.println(w2);
         }
         if(children != null)
         {
            for ( Node child : children)
            {
               if(child != null)
                  child.debug(w2);
            }
         }
      }
      
      private String convert()
      {
         return "" + (char) (((int)this.code & 0x7F) +65);
      }
      
      public String toString()
      {
         return convert();
      }
      
      private String random(final int depth)
      {
         final String w2 = depth == 0 ? "" : convert();
           
         Node next = null;
         final int idx = (int) (Math.random() * 25);
         
         if(children != null)
         {
            for ( int i=0; i <= 25 ; i++)
            {
               next = children[(idx+i) % children.length];
               if(next != null)
                  break;
            }
         }
                  
         if (next == null)
            return w2;

         return w2 + next.random(depth+1);
      }
      
      private int nodeCount()
      {
         int x = 1;

         if(children != null)
         {
            for ( Node child : children)
            {
               if(child != null)
                  x += child.nodeCount();
            }
         }
         return x;
      }
      
      private int size()
      {
         int x = 0;
         if ((this.code & 0x80) != 0 )
         {
            x++;
         }
         if(children != null)
         {
            for ( Node child : children)
            {
               if(child != null)
                  x += child.size();
            }
         }
         return x;
      }
   }
   
   
   public static void main(String[] args) throws Exception
   {
      //final WordTrie words = new WordTrie();
      final HashSet<String> words = new HashSet<>(9999);
      
        try(
         final BufferedReader br = new BufferedReader(new FileReader("./wordlist.txt"));
       )
       {
           String line = null;
           while ((line = br.readLine()) != null)
           {                 
              if (line.contains("/") || line.contains("-") || line.contains(".") 
                  || line.length() < 3 || line.length() > 15)
              {
                 continue;
              }
              words.add(line);
           }
       }
       catch (final Exception e)
       {
          e.printStackTrace();
       }
       
       //  words.debug();
     System.out.println(words.size() );// + " : " + words.nodeCount() );

     //  System.out.println(words.random());
     //  System.out.println(words.random());
     //  System.out.println(words.random());
       
       Thread.sleep(99999999L);
   }
}
