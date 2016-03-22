package org.lskk.lumen.trainer.mvc;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by ceefour on 22/03/2016.
 */
@RestController
@RequestMapping("api")
public class TrainerController {

    @RequestMapping(path = "hello")
    public String hello() {
        return "hello too";
    }
}
