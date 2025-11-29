import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateHashUtil {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("Test123!");
        System.out.println(hash);
    }
}
