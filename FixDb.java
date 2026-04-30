import java.sql.*;

public class FixDb {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/sgo_db?serverTimezone=UTC", "root", "1234");
            Statement stmt = conn.createStatement();
            
            System.out.println("Dropping stale columns...");
            stmt.executeUpdate("ALTER TABLE pecas DROP COLUMN precoUnitario");
            System.out.println("Dropped precoUnitario");
            
            stmt.executeUpdate("ALTER TABLE pecas DROP COLUMN quantidadeStock");
            System.out.println("Dropped quantidadeStock");
            
            stmt.executeUpdate("ALTER TABLE pecas DROP COLUMN stockMinimo");
            System.out.println("Dropped stockMinimo");
            
            System.out.println("Done!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
