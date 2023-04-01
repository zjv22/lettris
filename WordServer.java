import com.sun.net.httpserver.*;
import java.net.*;
import java.util.concurrent.*; 
import java.io.*;
import java.nio.file.*;
import java.util.*;



public class WordServer
{
   // private static final String host = "192.168.0.20"; // local network, must be run as root
   private static final int port = 8080; // 80
      
   private static final WordTrie words = new WordTrie();
   
   public static void main(String[] args) throws Exception
   {
       try(
         final BufferedReader br = new BufferedReader(new FileReader("./wordlist.txt"));
       )
       {
           String line = null;
           while ((line = br.readLine()) != null)
           {
              words.add(line);
           }
       }
       catch (final Exception e)
       {
          e.printStackTrace();
       }
      
      final ThreadPoolExecutor threadPoolExecutor = 
          (ThreadPoolExecutor)  Executors.newFixedThreadPool(2);
      
      
      // TODO : may need to increase the thread pool...
      //         new InetSocketAddress(host, port), 15);
      final HttpServer server = HttpServer.create(new InetSocketAddress(port), 30);

      server.createContext("/", new  MyHttpHandler());
      server.setExecutor(threadPoolExecutor);
      server.start();
      
      System.out.println("Server initialized on port:" + port + 
         "\n  initialized with " + words.size() + " words");
            
      if (false)  // debug scoring
      {
         System.out.println(scoreRow("w_gel"));
         System.out.println(scoreRow("gems"));
         System.out.println(scoreRow("qi___epoxy___d_za"));
      }
   }
   
   public static String convert(final String word)
   {
       return word.trim().toUpperCase();
   }
      
   private static final class MyHttpHandler implements HttpHandler
   {
      public void handle(final HttpExchange http) 
      {
         try
         {
            final OutputStream outputStream = http.getResponseBody();
            final String req = http.getRequestURI().toString();
            
            // Thread.sleep(500);
            
            if (req.contains("debug="))
            {
               System.out.println("client says : " + req );
            }
            if(req.contains("check="))
            {
                final String row = convert(req.split("=")[1]);
                String resp = scoreRow(row);
                if (resp != null)
                {
                   http.sendResponseHeaders(200, resp.length());
                   // System.out.println(req +" :: " + resp);
                }
                else
                {
                   resp = "N/A";
                   http.sendResponseHeaders(201, resp.length());
                }
                
                http.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
                outputStream.write(resp.getBytes());
                outputStream.flush();
                outputStream.close();
                return;
            }
            if (req.contains("loadWords"))
            {
               final StringBuilder chars = new StringBuilder();
               for (int i=0;i<3;i++)
               {
                  final ArrayList<Character> word = new ArrayList<>();
                  final String rand = convert(words.random());
                  // System.out.println("NEXT WORD : " + rand );
                  for (final Character c : rand.toCharArray())
                      word.add(c);
                  Collections.shuffle(word);
                  //Collections.reverse(word);  // TODO : debug testing verticle
                  for (Character c : word)
                     chars.append(c);
               }
               
               //Collections.shuffle(chars);
               
               final String output = chars.toString();
               // System.out.println("next batch : " + output );
               
               http.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
               http.sendResponseHeaders(200, output.length());
               outputStream.write(output.getBytes());
               outputStream.flush();
               outputStream.close();
               return;
            }
            
                            
            final Path path;
            if (req.contains("favicon"))
            {
                path = Paths.get("./lettrisTile.png");
                http.getResponseHeaders().set("Content-Type", "image/png");
            }
            else if (req.contains(".mp3"))
            {
                path = Paths.get("./homesick.mp3");
                http.getResponseHeaders().set("Content-Type", "audio/mpeg");
            }
            else if (req.contains(".js"))
            {
                path = Paths.get("./lettris.js");
                http.getResponseHeaders().set("Content-Type", "text/javascript; charset=UTF-8");

            }
            else
            {
                path = Paths.get("./lettris.html");
                http.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
            }
            
            final byte[] data = Files.readAllBytes(path);
            http.sendResponseHeaders(200, data.length);
            outputStream.write(data);
            outputStream.flush();
            outputStream.close();
         }
         catch(Throwable t)
         {
            t.printStackTrace();
         }
      }
   }
   
      
   private static String scoreRow(String row)
   {
      row = convert(row);
      if (!row.contains("_"))
         return scoreWord(row, 0);
         
      String bestWord = null;
      String bestScore = null;
      for (final String str : row.split("_"))
      {
         if (str.length() < 3)
            continue;
         
         final String score = scoreWord(str, row.indexOf(str) );
         if (score != null && (bestWord == null || bestWord.length() < str.length()))
         {
            bestScore = score;
            bestWord = str;
         }
      }
        
      return bestScore;
   }
   
   // returns String : "word;index;value"
   private static String scoreWord(final String str, final int start)
   {      
      if (words.contains(str))
         return str+";"+start+";"+wordValue(str);// +";"+str.length();
      
      if (str.length() < 4)
         return null;
         
      final String s1 = scoreWord(str.substring(0,str.length()-1), start);
      final String s2 = scoreWord(str.substring(1), start+1);
      if (s1 == null)
         return s2;
      if (s2 == null)
         return s1;
      return s2.length() > s1.length() ? s2 : s1;
   }
   
   private static int wordValue(final String word)
   {
      int score = 0;
      for(int i=0;i<word.length();i++)
      {
         final char c = word.charAt(i);
         switch(c)
         {
            case 'q' :
            case 'Q' :
               score += 8;
               break;
            case 'x' :
            case 'X' :
               score += 5;
               break;
            case 'z' :
            case 'Z' :
               score += 4;
               break;
            case 'v' :
            case 'V' :
               score += 3;
               break;
            case 'w' :
            case 'W' :
            case 'f' :
            case 'F' :
            case 'k' :
            case 'K' :
            case 'j' :
            case 'J' :
               score += 2;
               break;
            default : 
               score++;
         }
         if(i >= 3) // 4th letter or higher
            score++;
         if(i == 6)
            score += 3;
      }
      return score;
   }
   
}


