import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  memo,
  useMemo,
} from 'react';
import Die, { DieRef, DieProps } from './Die';
import './styles.scss'

export type DieContainerRef = {
  rollAll: (values?: number[]) => void
}

export interface DiceContainerProps extends Omit<DieProps, 'onRollDone' | 'defaultRoll'> {
  defaultRoll?: number 
  numDice: number
  onRoll?: () => void
  totalCb: (newTotalValue: number, newDiceValues: number[]) => void
}

const DiceContainer = forwardRef<DieContainerRef, DiceContainerProps>(
  ({ numDice, totalCb, defaultRoll = 6, ...rest }, ref): JSX.Element => {
    const diceRefs = useRef<Array<DieRef | null>>([]);
    // Initialize state based on numDice and defaultRoll
    const initialDiceValues = useMemo(() => Array(numDice).fill(defaultRoll), [numDice, defaultRoll]);
    const initialTotal = useMemo(() => initialDiceValues.reduce((sum, val) => sum + val, 0), [initialDiceValues]);

    const [totalValue, setTotalValue] = useState(initialTotal);
    const [diceValues, setDiceValues] = useState<number[]>(initialDiceValues);
    const [rollCount, setRollCount] = useState(0);
    const previousRollCount = useRef(0); 

    useImperativeHandle(ref, () => ({
      rollAll,
    }))

    const rollAll = (values: number[] = []) => {
      const currentDiceCount = diceRefs.current.filter(ref => ref !== null).length;
      if (currentDiceCount === 0) return; 
      setRollCount(currentDiceCount); 
      previousRollCount.current = currentDiceCount;
      let index = 0
      for (let die of diceRefs.current) {
        if (die !== null) {
          die.rollDie(values[index])
          index += 1
        }
      }
    }

    const onRollDone = () => {
      if (rollCount <= 0) {
        setTimeout(getRollResults, 100)
      } else {
        setRollCount((count) => {
            const newCount = count - 1
            previousRollCount.current = count
            return newCount
        })
      }
    }

     const getRollResults = () => {
      let newTotalValue = 0
      let newDiceValues: number[] = []
      for (let die of diceRefs.current) {
        if (die !== null) {
          const value = die.getValue ? die.getValue() : defaultRoll;
          newDiceValues.push(value)
          newTotalValue += value
        }
      }

      if (newTotalValue !== totalValue || JSON.stringify(newDiceValues) !== JSON.stringify(diceValues)) {
          setTotalValue(newTotalValue)
          setDiceValues(newDiceValues)
          totalCb(newTotalValue, newDiceValues)
      }
    };

    useEffect(() => {

      if (previousRollCount.current > 0 && rollCount <= 0) {
        setTimeout(getRollResults, 100);
      }
    }, [rollCount]); 

    useEffect(() => {
      const newInitialValues = Array(numDice).fill(defaultRoll);
      const newInitialTotal = newInitialValues.reduce((sum, val) => sum + val, 0);

      if (newInitialTotal !== totalValue || JSON.stringify(newInitialValues) !== JSON.stringify(diceValues)) {
        setDiceValues(newInitialValues);
        setTotalValue(newInitialTotal);
      }
      
      setRollCount(0);
      previousRollCount.current = 0;

    }, [numDice, defaultRoll]); 

    const getDice = useMemo(() => {
      diceRefs.current = Array(numDice).fill(null)
      let dice: JSX.Element[] = []
      for (let i = 0; i < numDice; i++) {
        dice.push(
          <Die
            {...rest}
            defaultRoll={defaultRoll}
            key={i}
            onRollDone={onRollDone}
            ref={(die) => (diceRefs.current[i] = die)} 
          />
        )
      }
      return dice
    }, [rest, numDice, onRollDone, defaultRoll])

    return <div className='dice'>{getDice}</div>
  }
)

export default memo(DiceContainer)
