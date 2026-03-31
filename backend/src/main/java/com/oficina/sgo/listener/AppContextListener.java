package com.oficina.sgo.listener;

import com.oficina.sgo.model.User;
import com.oficina.sgo.security.JwtTokenProvider;
import com.oficina.sgo.service.*;
import com.oficina.sgo.util.PasswordUtil;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;
import jakarta.persistence.Persistence;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebListener
public class AppContextListener implements ServletContextListener {

    private static final Logger log = LoggerFactory.getLogger(AppContextListener.class);

    private HikariDataSource dataSource;
    private EntityManagerFactory emf;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        ServletContext ctx = sce.getServletContext();

        String dbUrl = env("DB_URL", "jdbc:mysql://localhost:3306/sgo_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true");
        String dbUser = env("DB_USERNAME", "root");
        String dbPass = env("DB_PASSWORD", "1234");
        String jwtSecret = env("JWT_SECRET", "sgo-secret-key-2024-change-in-production-min-256-bits");
        long jwtExpiration = Long.parseLong(env("JWT_EXPIRATION", "86400000"));

        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setJdbcUrl(dbUrl);
        hikariConfig.setUsername(dbUser);
        hikariConfig.setPassword(dbPass);
        hikariConfig.setDriverClassName("com.mysql.cj.jdbc.Driver");
        hikariConfig.setMaximumPoolSize(10);
        hikariConfig.setMinimumIdle(2);
        hikariConfig.setConnectionTimeout(30000);
        hikariConfig.setPoolName("SGO-Pool");
        dataSource = new HikariDataSource(hikariConfig);	

        Map<String, Object> jpaProps = new HashMap<>();
        jpaProps.put("jakarta.persistence.nonJtaDataSource", dataSource);
        jpaProps.put("hibernate.hbm2ddl.auto", "update");
        jpaProps.put("hibernate.show_sql", "false");
        jpaProps.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");

        emf = Persistence.createEntityManagerFactory("sgo", jpaProps);
        ctx.setAttribute("emf", emf);

        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(jwtSecret, jwtExpiration);
        ctx.setAttribute("jwtTokenProvider", jwtTokenProvider);

        ctx.setAttribute("authService", new AuthService(emf, jwtTokenProvider));
        ctx.setAttribute("clienteService", new ClienteService(emf));
        ctx.setAttribute("viaturaService", new ViaturaService(emf));
        ctx.setAttribute("agendaService", new AgendaService(emf));
        ctx.setAttribute("reparacaoService", new ReparacaoService(emf));
        ctx.setAttribute("pecaService", new PecaService(emf));
        ctx.setAttribute("dashboardService", new DashboardService(emf));
        ctx.setAttribute("userService", new UserService(emf));

        seedInitialData(emf);

        log.info("SGO application initialized successfully");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (emf != null && emf.isOpen()) {
            emf.close();
        }
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
        log.info("SGO application shut down");
    }

    private void seedInitialData(EntityManagerFactory emf) {
        EntityManager em = emf.createEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            Long count = em.createQuery("SELECT COUNT(u) FROM User u", Long.class).getSingleResult();
            if (count == 0) {
                User admin = User.builder()
                        .username("admin")
                        .password(PasswordUtil.encode("admin123"))
                        .name("Administrador")
                        .email("admin@sgo.pt")
                        .role(User.Role.MANAGER)
                        .active(true)
                        .build();
                em.persist(admin);
                log.warn("SECURITY: Initial MANAGER user created with default credentials (admin/admin123). " +
                         "Change this password immediately in production!");
            }
            tx.commit();
        } catch (Exception e) {
            if (tx.isActive()) tx.rollback();
            log.error("Error seeding initial data", e);
        } finally {
            em.close();
        }
    }

    private String env(String name, String defaultValue) {
        String val = System.getenv(name);
        if (val == null || val.isBlank()) {
            val = System.getProperty(name);
        }
        return (val == null || val.isBlank()) ? defaultValue : val;
    }
}
