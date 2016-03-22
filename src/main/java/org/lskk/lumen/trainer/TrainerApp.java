package org.lskk.lumen.trainer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.groovy.template.GroovyTemplateAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.Profile;

@SpringBootApplication(exclude = {GroovyTemplateAutoConfiguration.class})
@Profile("trainerApp")
//@Import(LumenCoreConfig.class)
class TrainerApp implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(TrainerApp.class);

    public static void main(String[] args) {
        new SpringApplicationBuilder(TrainerApp.class)
                .profiles("trainerApp")
                .run(args);
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Joining thread, you can press Ctrl+C to shutdown application");
        Thread.currentThread().join();
    }
}
