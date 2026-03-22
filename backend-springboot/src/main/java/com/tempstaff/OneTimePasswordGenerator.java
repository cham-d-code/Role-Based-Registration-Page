
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class OneTimePasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("HASH: " + encoder.encode("password123"));
    }
}
