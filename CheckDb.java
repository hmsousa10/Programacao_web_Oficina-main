import java.sql.*;

public class CheckDb {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/sgo_db?serverTimezone=UTC", "root", "1234");
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet rs = meta.getColumns(null, null, "pecas", null);
            System.out.println("--- COLUMNS IN TABLE pecas ---");
            while (rs.next()) {
                System.out.println(rs.getString("COLUMN_NAME") + " - " + rs.getString("TYPE_NAME") + " - Nullable: " + rs.getString("IS_NULLABLE"));
            }
            System.out.println("------------------------------");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
