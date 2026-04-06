import { useEffect, useState } from 'react'
import Fuse from 'fuse.js'
import cidadesBR from '../data/cidadesBR.json'

export function useCidades(uf) {
  const [ufs, setUfs] = useState([])
  const [cidades, setCidades] = useState([])
  const [cidadeBusca, setCidadeBusca] = useState('')
  const [cidadesFiltradas, setCidadesFiltradas] = useState([])
  const [fuse, setFuse] = useState(null)
  const [cidadeErro, setCidadeErro] = useState('')

  const normalizar = (texto) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  // carregar UFs
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((res) => res.json())
      .then((data) => setUfs(data))
  }, [])

  // carregar cidades por UF
  useEffect(() => {
    if (!uf) return

    const cidadesUF = cidadesBR
      .filter((c) => c.uf === uf)
      .map((c) => ({
        ...c,
        nomeBusca: normalizar(c.nome),
      }))

    setCidades(cidadesUF)

    setFuse(
      new Fuse(cidadesUF, {
        keys: ['nomeBusca'],
        threshold: 0.3,
      })
    )
  }, [uf])

  // busca fuzzy
  useEffect(() => {
    if (!fuse || cidadeBusca.length < 2) {
      setCidadesFiltradas([])
      return
    }

    const termo = normalizar(cidadeBusca)

    const resultado = fuse
      .search(termo)
      .slice(0, 5)
      .map((r) => r.item)

    setCidadesFiltradas(resultado)
  }, [cidadeBusca, fuse])

  const setCidadeSelecionada = (cidade) => {
    setCidadeBusca(cidade)
    setCidadeErro('')
    setCidadesFiltradas([])
  }

  return {
    ufs,
    cidades,
    cidadeBusca,
    setCidadeBusca,
    cidadesFiltradas,
    cidadeErro,
    setCidadeErro,
    setCidadeSelecionada,
  }
}
