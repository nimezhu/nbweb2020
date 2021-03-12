package main

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/nimezhu/data"
	"github.com/nimezhu/sand"
	"github.com/nimezhu/tbl2x"
)

func addDataServer(uri string, router *mux.Router, indexRoot string) {
	genomes := "hg19,mm10,hg38,mm9,rn6,rn4,dm6,dm3"
	cytoBandManager := data.NewCytoBandManager("band")
	gs := strings.Split(genomes, ",")
	for _, v := range gs {
		cytoBandManager.Add(v)
	}
	cytoBandManager.ServeTo(router)
	l := data.NewLoader(indexRoot) //TODO set Index Root , set l refresh
	l.Plugins["tsv"] = func(dbname string, data interface{}) (data.DataRouter, error) {
		fmt.Println(dbname, data)
		switch v := data.(type) {
		default:
			fmt.Printf("unexpected type %T", v)
			return nil, errors.New(fmt.Sprintf("bigwig format not support type %T", v))
		case string:
			return nil, errors.New("todo")
		case map[string]interface{}:
			r := &tbl2x.TableRouter{dbname, make(map[string]*tbl2x.Table)}
			err := r.Load(data.(map[string]interface{}))
			return r, err
		}
	}
	l.Load(uri, router)
	router.Handle("/cmd/reload", sand.AdminAccess(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		l.Reload(uri)
	})))
}
