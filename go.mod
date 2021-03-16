module nbweb

go 1.14

require (
	github.com/boltdb/bolt v1.3.1 // indirect
	github.com/gin-gonic/gin v1.6.3 // indirect
	github.com/gorilla/mux v1.8.0
	github.com/gorilla/sessions v1.2.1 // indirect
	github.com/nimezhu/asheets v0.0.1
	github.com/nimezhu/data v0.0.17
	github.com/nimezhu/sand v0.0.0-20200622062844-aa30c82eb1c8
	github.com/nimezhu/snowjs v0.0.0-20191009183904-e76f11215360 // indirect
	github.com/nimezhu/tbl2x v0.0.1
	github.com/tealeg/xlsx v1.0.5
	github.com/urfave/cli v1.22.5
	golang.org/x/oauth2 v0.0.0-20210313182246-cd4f82c27b84
	gonum.org/v1/gonum v0.9.0 // indirect
	google.golang.org/api v0.42.0
)

replace (
	github.com/nimezhu/sand v0.0.0-20200622062844-aa30c82eb1c8 => ../mylib/sand
	github.com/urfave/cli v1.22.5 => ../src/github.com/urfave/cli
)
