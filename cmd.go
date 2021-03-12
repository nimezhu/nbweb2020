package main

import (
	"os"

	"github.com/urfave/cli"
)

const (
	VERSION = "v0.7.0"
)

func main() {
	app := cli.NewApp()
	app.Version = VERSION
	app.Name = "sandNb"
	app.Usage = "Nucleome Browser Web Server"
	app.EnableBashCompletion = true //TODO
	app.Flags = []cli.Flag{
		&cli.BoolFlag{
			Name:  "verbose",
			Usage: "Show more output",
		},
	}
	app.Commands = []*cli.Command{
		{
			Name:   "start",
			Usage:  "start a server",
			Action: CmdStart,
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:    "input",
					Aliases: []string{"i"},
					Usage:   "input data tsv/xls/google sheet id",
					Value:   "",
				},
				&cli.IntFlag{
					Name:    "port",
					Aliases: []string{"p"},
					Usage:   "data server port",
					Value:   8080,
				},
				&cli.StringFlag{
					Name:    "root",
					Aliases: []string{"r"},
					Usage:   "root directory",
					Value:   os.Getenv("HOME"),
				},
				&cli.StringFlag{
					Name:    "cred",
					Aliases: []string{"c"},
					Usage:   "cred.json config file",
					Value:   "./creds.json",
				},
				&cli.StringFlag{
					Name:    "ext",
					Aliases: []string{"e"},
					Usage:   "chrome extenstion id, Default is Nucleome Browswer Extension in chrome web store",
					Value:   "djcdicpaejhpgncicoglfckiappkoeof",
				},
			},
		},
	}
	app.Run(os.Args)
}
